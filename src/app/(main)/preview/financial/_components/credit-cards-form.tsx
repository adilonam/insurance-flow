"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { format, addMonths, startOfMonth, endOfMonth, differenceInDays, isWithinInterval } from "date-fns";
import { Trash2, Upload, Calendar, AlertTriangle, FileText, CreditCard, Plus, Loader2, X, Eye, Pencil, Info, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type CreditCardType = {
  id?: string;
  issuer: string;
  last4?: string;
  balance: number;
  limit: number;
  status: string;
  requiredPeriodStart?: Date;
  requiredPeriodEnd?: Date;
  cardStatements?: any[];
};

type CardStatement = {
  id?: string;
  month: number;
  year: number;
  startDate: Date;
  endDate: Date;
  daysCovered: number;
  totalDays: number;
  coveragePercent: number;
  uploaded: boolean;
  fileKey?: string;
  fileName?: string;
  uploadedAt?: Date;
};

type CreditCardsFormProps = {
  claimId: string;
  accidentDate: Date;
  onCardsChange?: (count: number) => void;
};

export function CreditCardsForm({ claimId, accidentDate, onCardsChange }: CreditCardsFormProps) {
  const [cards, setCards] = useState<CreditCardType[]>([]);
  const [statements, setStatements] = useState<Record<string, CardStatement[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingCardIndex, setUploadingCardIndex] = useState<number | null>(null);
  const [statementStartDate, setStatementStartDate] = useState<Date | undefined>();
  const [statementEndDate, setStatementEndDate] = useState<Date | undefined>();
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isUploadingStatement, setIsUploadingStatement] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate required period (3 months before accident) - memoized to prevent infinite loops
  const requiredPeriodStart = useMemo(() => addMonths(accidentDate, -3), [accidentDate]);
  const requiredPeriodEnd = useMemo(() => accidentDate, [accidentDate]);

  const [newCard, setNewCard] = useState<CreditCardType>(() => ({
    issuer: "",
    last4: "",
    balance: 0,
    limit: 0,
    status: "Active",
    requiredPeriodStart: addMonths(accidentDate, -3),
    requiredPeriodEnd: accidentDate,
  }));

  // Update newCard when dates change
  useEffect(() => {
    setNewCard((prev) => ({
      ...prev,
      requiredPeriodStart,
      requiredPeriodEnd,
    }));
  }, [requiredPeriodStart, requiredPeriodEnd]);

  // Generate monthly breakdown for required period
  const generateMonthlyBreakdown = (start: Date, end: Date) => {
    const months: Array<{ month: number; year: number; startDate: Date; endDate: Date }> = [];
    let current = startOfMonth(start);
    const endMonth = endOfMonth(end);

    while (current <= endMonth) {
      const monthStart = current > start ? current : start;
      const monthEnd = endOfMonth(current) < end ? endOfMonth(current) : end;
      months.push({
        month: current.getMonth() + 1,
        year: current.getFullYear(),
        startDate: monthStart,
        endDate: monthEnd,
      });
      current = addMonths(current, 1);
    }
    return months;
  };

  // Fetch existing credit cards
  useEffect(() => {
    const fetchCreditCards = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/claims/${claimId}/financial-step`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.creditCards) {
            const mappedCards = data.creditCards.map((card: any) => ({
              id: card.id,
              issuer: card.issuer || "",
              last4: card.last4 || "",
              balance: card.balance ? parseFloat(card.balance.toString()) : 0,
              limit: card.limit ? parseFloat(card.limit.toString()) : 0,
              status: card.status || "Active",
              requiredPeriodStart,
              requiredPeriodEnd,
              cardStatements: card.cardStatements || [],
            }));
            setCards(mappedCards);
            
            // Load statements from database and calculate coverage
            const newStatements: Record<string, CardStatement[]> = {};
            mappedCards.forEach((card: any, index: number) => {
              const cardId = card.id || `card-${index}`;
              const months = generateMonthlyBreakdown(requiredPeriodStart, requiredPeriodEnd);
              const dbStatements = card.cardStatements || [];
              
              newStatements[cardId] = months.map((m) => {
                const coveringStatements = dbStatements.filter((stmt: any) => {
                  const stmtStart = new Date(stmt.startDate);
                  const stmtEnd = new Date(stmt.endDate);
                  return (stmtStart <= m.endDate && stmtEnd >= m.startDate);
                });
                
                if (coveringStatements.length > 0) {
                  let totalCoveredDays = 0;
                  coveringStatements.forEach((stmt: any) => {
                    const stmtStart = new Date(stmt.startDate);
                    const stmtEnd = new Date(stmt.endDate);
                    const overlapStart = stmtStart > m.startDate ? stmtStart : m.startDate;
                    const overlapEnd = stmtEnd < m.endDate ? stmtEnd : m.endDate;
                    const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
                    totalCoveredDays += overlapDays;
                  });
                  const totalDays = differenceInDays(m.endDate, m.startDate) + 1;
                  const coveragePercent = Math.min(100, (totalCoveredDays / totalDays) * 100);
                  
                  return {
                    id: coveringStatements[0].id,
                    month: m.month,
                    year: m.year,
                    startDate: m.startDate,
                    endDate: m.endDate,
                    daysCovered: Math.min(totalCoveredDays, totalDays),
                    totalDays,
                    coveragePercent,
                    uploaded: true,
                    fileKey: coveringStatements[0].fileKey,
                    fileName: coveringStatements[0].fileName,
                    uploadedAt: coveringStatements[0].uploadedAt ? new Date(coveringStatements[0].uploadedAt) : undefined,
                  };
                }
                
                return {
                  month: m.month,
                  year: m.year,
                  startDate: m.startDate,
                  endDate: m.endDate,
                  daysCovered: 0,
                  totalDays: differenceInDays(m.endDate, m.startDate) + 1,
                  coveragePercent: 0,
                  uploaded: false,
                };
              });
            });
            setStatements(newStatements);
            onCardsChange?.(mappedCards.length);
          } else {
            setCards([]);
            setStatements({});
            onCardsChange?.(0);
          }
        } else {
          onCardsChange?.(0);
        }
      } catch (error) {
        console.error("Error fetching credit cards:", error);
        onCardsChange?.(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (claimId) {
      fetchCreditCards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const addCard = () => {
    setShowAddForm(true);
    setEditingIndex(null);
  };

  const handleAddNewCard = async () => {
    try {
      setIsSaving(true);
      const updatedCards = [...cards, { ...newCard }];
      
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creditCards: updatedCards.map((card) => ({
            issuer: card.issuer,
            last4: card.last4,
            balance: card.balance,
            limit: card.limit,
            status: card.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save credit card");
      }

      const data = await response.json();
      
      if (data.creditCards) {
        setCards(data.creditCards.map((card: any) => ({
          id: card.id,
          issuer: card.issuer || "",
          last4: card.last4 || "",
          balance: card.balance ? parseFloat(card.balance.toString()) : 0,
          limit: card.limit ? parseFloat(card.limit.toString()) : 0,
          status: card.status || "Active",
          requiredPeriodStart,
          requiredPeriodEnd,
          cardStatements: card.cardStatements || [],
        })));
        
        const newStatements: Record<string, CardStatement[]> = {};
        data.creditCards.forEach((card: any, index: number) => {
          const cardId = card.id || `card-${index}`;
          const months = generateMonthlyBreakdown(requiredPeriodStart, requiredPeriodEnd);
          newStatements[cardId] = months.map((m) => ({
            month: m.month,
            year: m.year,
            startDate: m.startDate,
            endDate: m.endDate,
            daysCovered: 0,
            totalDays: differenceInDays(m.endDate, m.startDate) + 1,
            coveragePercent: 0,
            uploaded: false,
          }));
        });
        setStatements(newStatements);
      }

      onCardsChange?.(data.creditCards.length);

      setNewCard({
        issuer: "",
        last4: "",
        balance: 0,
        limit: 0,
        status: "Active",
        requiredPeriodStart,
        requiredPeriodEnd,
      });
      setShowAddForm(false);
      toast.success("Credit card added successfully");
    } catch (error) {
      console.error("Error adding credit card:", error);
      toast.error("Failed to add credit card");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setEditingIndex(null);
  };

  const removeCard = async (index: number) => {
    const card = cards[index];
    const newCards = cards.filter((_, i) => i !== index);
    setCards(newCards);
    const cardId = card.id || `card-${index}`;
    const newStatements = { ...statements };
    delete newStatements[cardId];
    setStatements(newStatements);

    try {
      setIsSaving(true);
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creditCards: newCards.map((card) => ({
            issuer: card.issuer,
            last4: card.last4,
            balance: card.balance,
            limit: card.limit,
            status: card.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete credit card");
      }

      const data = await response.json();
      if (data.creditCards) {
        setCards(data.creditCards.map((card: any) => ({
          id: card.id,
          issuer: card.issuer || "",
          last4: card.last4 || "",
          balance: card.balance ? parseFloat(card.balance.toString()) : 0,
          limit: card.limit ? parseFloat(card.limit.toString()) : 0,
          status: card.status || "Active",
          requiredPeriodStart,
          requiredPeriodEnd,
          cardStatements: card.cardStatements || [],
        })));
        onCardsChange?.(data.creditCards.length);
      }

      toast.success("Credit card deleted successfully");
    } catch (error) {
      console.error("Error deleting credit card:", error);
      toast.error("Failed to delete credit card");
      setCards(cards);
    } finally {
      setIsSaving(false);
    }
  };

  const updateCard = (index: number, field: keyof CreditCardType, value: any) => {
    const newCards = [...cards];
    newCards[index] = { ...newCards[index], [field]: value };
    setCards(newCards);
  };

  const handleOpenUploadModal = (cardIndex: number) => {
    setUploadingCardIndex(cardIndex);
    setShowUploadModal(true);
    setStatementStartDate(undefined);
    setStatementEndDate(undefined);
    setUploadingFile(null);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadingFile(file);
    }
  };

  const handleUploadStatement = async () => {
    if (!uploadingFile || uploadingCardIndex === null || !statementStartDate || !statementEndDate) {
      toast.error("Please select a file and specify the statement period");
      return;
    }

    const card = cards[uploadingCardIndex];
    if (!card.id) {
      toast.error("Card must be saved before uploading statements");
      return;
    }

    try {
      setIsUploadingStatement(true);
      const formData = new FormData();
      formData.append("file", uploadingFile);
      formData.append("creditCardId", card.id);
      formData.append("startDate", statementStartDate.toISOString());
      formData.append("endDate", statementEndDate.toISOString());

      const response = await fetch(`/api/claims/${claimId}/financial-step/card-statements`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload statement");
      }

      // Refresh cards and statements
      const financialStepResponse = await fetch(`/api/claims/${claimId}/financial-step`);
      if (financialStepResponse.ok) {
        const data = await financialStepResponse.json();
        if (data && data.creditCards) {
          const mappedCards = data.creditCards.map((card: any) => ({
            id: card.id,
            issuer: card.issuer || "",
            last4: card.last4 || "",
            balance: card.balance ? parseFloat(card.balance.toString()) : 0,
            limit: card.limit ? parseFloat(card.limit.toString()) : 0,
            status: card.status || "Active",
            requiredPeriodStart,
            requiredPeriodEnd,
            cardStatements: card.cardStatements || [],
          }));
          setCards(mappedCards);
          
          const newStatements: Record<string, CardStatement[]> = {};
          mappedCards.forEach((card: any, index: number) => {
            const cardId = card.id || `card-${index}`;
            const months = generateMonthlyBreakdown(requiredPeriodStart, requiredPeriodEnd);
            const dbStatements = card.cardStatements || [];
            
            newStatements[cardId] = months.map((m) => {
              const coveringStatements = dbStatements.filter((stmt: any) => {
                const stmtStart = new Date(stmt.startDate);
                const stmtEnd = new Date(stmt.endDate);
                return (stmtStart <= m.endDate && stmtEnd >= m.startDate);
              });
              
              if (coveringStatements.length > 0) {
                let totalCoveredDays = 0;
                coveringStatements.forEach((stmt: any) => {
                  const stmtStart = new Date(stmt.startDate);
                  const stmtEnd = new Date(stmt.endDate);
                  const overlapStart = stmtStart > m.startDate ? stmtStart : m.startDate;
                  const overlapEnd = stmtEnd < m.endDate ? stmtEnd : m.endDate;
                  const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
                  totalCoveredDays += overlapDays;
                });
                const totalDays = differenceInDays(m.endDate, m.startDate) + 1;
                const coveragePercent = Math.min(100, (totalCoveredDays / totalDays) * 100);
                
                return {
                  id: coveringStatements[0].id,
                  month: m.month,
                  year: m.year,
                  startDate: m.startDate,
                  endDate: m.endDate,
                  daysCovered: Math.min(totalCoveredDays, totalDays),
                  totalDays,
                  coveragePercent,
                  uploaded: true,
                  fileKey: coveringStatements[0].fileKey,
                  fileName: coveringStatements[0].fileName,
                  uploadedAt: coveringStatements[0].uploadedAt ? new Date(coveringStatements[0].uploadedAt) : undefined,
                };
              }
              
              return {
                month: m.month,
                year: m.year,
                startDate: m.startDate,
                endDate: m.endDate,
                daysCovered: 0,
                totalDays: differenceInDays(m.endDate, m.startDate) + 1,
                coveragePercent: 0,
                uploaded: false,
              };
            });
          });
          setStatements(newStatements);
        }
      }

      setShowUploadModal(false);
      setUploadingFile(null);
      setStatementStartDate(undefined);
      setStatementEndDate(undefined);
      setUploadingCardIndex(null);
      toast.success("Card statement uploaded successfully");
    } catch (error) {
      console.error("Error uploading statement:", error);
      toast.error("Failed to upload card statement");
    } finally {
      setIsUploadingStatement(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteStatement = async (cardIndex: number, statementId: string) => {
    try {
      const response = await fetch(`/api/claims/${claimId}/financial-step/card-statements?statementId=${statementId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete statement");
      }

      const card = cards[cardIndex];
      if (card.id) {
        const financialStepResponse = await fetch(`/api/claims/${claimId}/financial-step`);
        if (financialStepResponse.ok) {
          const data = await financialStepResponse.json();
          if (data && data.creditCards) {
            const cardData = data.creditCards.find((c: any) => c.id === card.id);
            if (cardData) {
              const cardId = card.id;
              const months = generateMonthlyBreakdown(requiredPeriodStart, requiredPeriodEnd);
              const dbStatements = cardData.cardStatements || [];
              
              setStatements({
                ...statements,
                [cardId]: months.map((m) => {
                  const coveringStatements = dbStatements.filter((stmt: any) => {
                    const stmtStart = new Date(stmt.startDate);
                    const stmtEnd = new Date(stmt.endDate);
                    return (stmtStart <= m.endDate && stmtEnd >= m.startDate);
                  });
                  
                  if (coveringStatements.length > 0) {
                    let totalCoveredDays = 0;
                    coveringStatements.forEach((stmt: any) => {
                      const stmtStart = new Date(stmt.startDate);
                      const stmtEnd = new Date(stmt.endDate);
                      const overlapStart = stmtStart > m.startDate ? stmtStart : m.startDate;
                      const overlapEnd = stmtEnd < m.endDate ? stmtEnd : m.endDate;
                      const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
                      totalCoveredDays += overlapDays;
                    });
                    const totalDays = differenceInDays(m.endDate, m.startDate) + 1;
                    const coveragePercent = Math.min(100, (totalCoveredDays / totalDays) * 100);
                    
                    return {
                      id: coveringStatements[0].id,
                      month: m.month,
                      year: m.year,
                      startDate: m.startDate,
                      endDate: m.endDate,
                      daysCovered: Math.min(totalCoveredDays, totalDays),
                      totalDays,
                      coveragePercent,
                      uploaded: true,
                      fileKey: coveringStatements[0].fileKey,
                      fileName: coveringStatements[0].fileName,
                      uploadedAt: coveringStatements[0].uploadedAt ? new Date(coveringStatements[0].uploadedAt) : undefined,
                    };
                  }
                  
                  return {
                    month: m.month,
                    year: m.year,
                    startDate: m.startDate,
                    endDate: m.endDate,
                    daysCovered: 0,
                    totalDays: differenceInDays(m.endDate, m.startDate) + 1,
                    coveragePercent: 0,
                    uploaded: false,
                  };
                }),
              });
            }
          }
        }
      }

      toast.success("Statement deleted successfully");
    } catch (error) {
      console.error("Error deleting statement:", error);
      toast.error("Failed to delete statement");
    }
  };

  const getCoverageStatus = (cardIndex: number) => {
    const cardId = cards[cardIndex]?.id || `card-${cardIndex}`;
    const cardStatements = statements[cardId] || [];
    const totalMonths = cardStatements.length;
    const coveredMonths = cardStatements.filter((s) => s.uploaded).length;
    return { covered: coveredMonths, total: totalMonths };
  };

  const isIncomplete = (cardIndex: number) => {
    const status = getCoverageStatus(cardIndex);
    return status.covered < status.total;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="size-5" />
          <h3 className="text-lg font-semibold">Credit/Store Cards</h3>
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Current Cards</h3>
          <Button onClick={addCard} size="sm" disabled={showAddForm}>
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </div>

        {/* List of Credit Cards - Simple List View */}
        {cards.length > 0 && (
          <div className="space-y-2">
            {cards.map((card, cardIndex) => {
              const cardId = card.id || `card-${cardIndex}`;
              const cardStatements = statements[cardId] || [];
              const months = generateMonthlyBreakdown(requiredPeriodStart, requiredPeriodEnd);
              const coverage = getCoverageStatus(cardIndex);
              const isExpanded = expandedCards[cardIndex] || false;
              // Get actual uploaded statements from database (not monthly breakdown)
              const uploadedStatements = (card.cardStatements || []).map((stmt: any) => ({
                id: stmt.id,
                startDate: new Date(stmt.startDate),
                endDate: new Date(stmt.endDate),
                fileKey: stmt.fileKey,
                fileName: stmt.fileName,
                uploadedAt: stmt.uploadedAt ? new Date(stmt.uploadedAt) : undefined,
              }));

              return (
                <div key={cardIndex}>
                  {/* Card List Item - Clickable Row */}
                  <Card
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setExpandedCards({ ...expandedCards, [cardIndex]: !isExpanded })}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium">
                          Card {cardIndex + 1} {card.status && `(${card.status})`}
                        </span>
                        {card.issuer && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{card.issuer}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCards({ ...expandedCards, [cardIndex]: !isExpanded });
                          }}
                        >
                          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeCard(cardIndex);
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Expanded Card Form */}
                  {isExpanded && (
                    <Card className="border-2 mt-2">
                      <CardContent className="space-y-4 pt-6">
                        {/* Card Fields */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Issuer</Label>
                            <Input
                              placeholder="Issuer"
                              value={card.issuer}
                              onChange={(e) => updateCard(cardIndex, "issuer", e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Last 4</Label>
                            <Input
                              placeholder="1234"
                              maxLength={4}
                              value={card.last4}
                              onChange={(e) => updateCard(cardIndex, "last4", e.target.value.replace(/\D/g, "").slice(0, 4))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Balance</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={card.balance}
                              onChange={(e) => updateCard(cardIndex, "balance", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Limit</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={card.limit}
                              onChange={(e) => updateCard(cardIndex, "limit", parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                              value={card.status}
                              onValueChange={(value) => updateCard(cardIndex, "status", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Delinquent">Delinquent</SelectItem>
                                <SelectItem value="Settled">Settled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Card Statements Section */}
                        <div className="space-y-4 border-t pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="size-4" />
                              <h4 className="font-medium">Card Statements (3 Months Before Accident)</h4>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                                {coverage.covered}/{coverage.total} months
                              </Badge>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenUploadModal(cardIndex)}
                                disabled={!card.id}
                              >
                                <Upload className="mr-2 size-4" />
                                Upload
                              </Button>
                            </div>
                          </div>

                          {/* Required Period Coverage */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="size-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Required Period Coverage</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Required: {format(requiredPeriodStart, "dd MMM yyyy")} - {format(requiredPeriodEnd, "dd MMM yyyy")}
                            </p>
                          </div>

                          {/* Monthly Breakdown */}
                          <div className="grid grid-cols-2 gap-3">
                            {months.map((month, monthIndex) => {
                              const statement = cardStatements[monthIndex] || {
                                month: month.month,
                                year: month.year,
                                startDate: month.startDate,
                                endDate: month.endDate,
                                daysCovered: 0,
                                totalDays: differenceInDays(month.endDate, month.startDate) + 1,
                                coveragePercent: 0,
                                uploaded: false,
                              };
                              const isMissing = !statement.uploaded;

                              return (
                                <Card key={monthIndex} className={cn("p-3", isMissing && "border-red-300 bg-red-50/50 dark:bg-red-950/20")}>
                                  <div className="space-y-2">
                                    <span className="text-sm font-medium">{format(month.startDate, "MMM yyyy")}</span>
                                    <p className="text-xs text-muted-foreground">
                                      {format(month.startDate, "dd MMM")} - {format(month.endDate, "dd MMM")}
                                    </p>
                                    <div className="h-2 w-full rounded-full bg-muted">
                                      <div
                                        className={cn(
                                          "h-full rounded-full",
                                          isMissing ? "bg-red-500" : "bg-green-500",
                                        )}
                                        style={{ width: `${statement.coveragePercent}%` }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">
                                        {statement.daysCovered}/{statement.totalDays} days
                                      </span>
                                      <span className="text-muted-foreground">{statement.coveragePercent.toFixed(2)}%</span>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>

                          {/* Uploaded Statements List */}
                          {uploadedStatements.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium">Uploaded Statements:</h5>
                              {uploadedStatements.map((stmt) => (
                                <div key={stmt.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent cursor-pointer transition-colors">
                                  <div
                                    className="flex items-center gap-2 flex-1"
                                    onClick={() => {
                                      if (stmt.fileKey) {
                                        const downloadUrl = `/api/claims/${claimId}/financial-step/card-statements/download?fileKey=${encodeURIComponent(stmt.fileKey)}&fileName=${encodeURIComponent(stmt.fileName || "statement")}`;
                                        window.open(downloadUrl, "_blank");
                                      }
                                    }}
                                  >
                                    <FileText className="size-4 text-muted-foreground" />
                                    <div>
                                      <p className="text-sm font-medium">
                                        {format(stmt.startDate, "dd MMM yyyy")} - {format(stmt.endDate, "dd MMM yyyy")}
                                      </p>
                                      {stmt.uploadedAt && (
                                        <p className="text-xs text-muted-foreground">
                                          Uploaded: {format(stmt.uploadedAt, "dd/MM/yyyy HH:mm")}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (stmt.fileKey) {
                                          const downloadUrl = `/api/claims/${claimId}/financial-step/card-statements/download?fileKey=${encodeURIComponent(stmt.fileKey)}&fileName=${encodeURIComponent(stmt.fileName || "statement")}`;
                                          window.open(downloadUrl, "_blank");
                                        }
                                      }}
                                    >
                                      <Eye className="size-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (stmt.fileKey) {
                                          const downloadUrl = `/api/claims/${claimId}/financial-step/card-statements/download?fileKey=${encodeURIComponent(stmt.fileKey)}&fileName=${encodeURIComponent(stmt.fileName || "statement")}`;
                                          const link = document.createElement("a");
                                          link.href = downloadUrl;
                                          link.download = stmt.fileName || "statement";
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }
                                      }}
                                    >
                                      <Pencil className="size-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        stmt.id && handleDeleteStatement(cardIndex, stmt.id);
                                      }}
                                    >
                                      <Trash2 className="size-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Warning Message */}
                          {isIncomplete(cardIndex) && (
                            <Alert className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
                              <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-400" />
                              <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                                Incomplete: Upload statements covering the missing periods highlighted above.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add New Card Form */}
        {showAddForm && (
          <Card className="border-2 border-dashed">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Add New Credit/Store Card</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancelAdd}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issuer</Label>
                  <Input
                    placeholder="Issuer"
                    value={newCard.issuer}
                    onChange={(e) => setNewCard({ ...newCard, issuer: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last 4</Label>
                  <Input
                    placeholder="1234"
                    maxLength={4}
                    value={newCard.last4}
                    onChange={(e) => setNewCard({ ...newCard, last4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Balance</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newCard.balance}
                    onChange={(e) => setNewCard({ ...newCard, balance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Limit</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newCard.limit}
                    onChange={(e) => setNewCard({ ...newCard, limit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newCard.status}
                    onValueChange={(value) => setNewCard({ ...newCard, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Delinquent">Delinquent</SelectItem>
                      <SelectItem value="Settled">Settled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelAdd} disabled={isSaving}>
                  Cancel
                </Button>
                <Button onClick={handleAddNewCard} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Card"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {cards.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CreditCard className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No credit cards added yet</p>
            <Button onClick={addCard} className="mt-4">
              <Plus className="mr-2 size-4" />
              Add Credit Card
            </Button>
          </div>
        )}
      </div>

      {/* Upload Statement Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Card Statement</DialogTitle>
            <DialogDescription>Specify the period covered by this card statement</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Statement Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !statementStartDate && "text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 size-4" />
                    {statementStartDate ? format(statementStartDate, "dd/MM/yyyy") : "dd/mm/yyyy"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={statementStartDate}
                    onSelect={setStatementStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Statement End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !statementEndDate && "text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 size-4" />
                    {statementEndDate ? format(statementEndDate, "dd/MM/yyyy") : "dd/mm/yyyy"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent
                    mode="single"
                    selected={statementEndDate}
                    onSelect={setStatementEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Alert>
              <Info className="size-4" />
              <AlertDescription>
                Enter the exact date range shown on the statement (e.g., 01/07/2025 to 31/07/2025)
              </AlertDescription>
            </Alert>
            {uploadingFile && (
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">{uploadingFile.name}</p>
                <p className="text-xs text-muted-foreground">{(uploadingFile.size / 1024).toFixed(2)} KB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadModal(false)} disabled={isUploadingStatement}>
              Cancel
            </Button>
            <Button onClick={handleUploadStatement} disabled={isUploadingStatement || !uploadingFile || !statementStartDate || !statementEndDate}>
              {isUploadingStatement ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Upload Statement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
