"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { format, addMonths, startOfMonth, endOfMonth, differenceInDays, isWithinInterval } from "date-fns";
import { Trash2, Upload, Calendar, AlertTriangle, FileText, Building2, Plus, Loader2, X, Eye, Pencil, Info, ChevronUp, ChevronDown } from "lucide-react";
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

type BankAccount = {
  id?: string;
  bankName: string;
  accountNumber: string;
  accountType: string;
  last4?: string;
  balance: number;
  overdraftLimit?: number;
  overdraftUsed: number;
  status: string;
  requiredPeriodStart?: Date;
  requiredPeriodEnd?: Date;
  bankStatements?: any[];
};

type BankStatement = {
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

type BankAccountsFormProps = {
  claimId: string;
  accidentDate: Date;
  onAccountsChange?: (count: number) => void;
};

export function BankAccountsForm({ claimId, accidentDate, onAccountsChange }: BankAccountsFormProps) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [statements, setStatements] = useState<Record<string, BankStatement[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadingAccountIndex, setUploadingAccountIndex] = useState<number | null>(null);
  const [statementStartDate, setStatementStartDate] = useState<Date | undefined>();
  const [statementEndDate, setStatementEndDate] = useState<Date | undefined>();
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isUploadingStatement, setIsUploadingStatement] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Record<number, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate required period (3 months before accident) - memoized to prevent infinite loops
  const requiredPeriodStart = useMemo(() => addMonths(accidentDate, -3), [accidentDate]);
  const requiredPeriodEnd = useMemo(() => accidentDate, [accidentDate]);

  const [newAccount, setNewAccount] = useState<BankAccount>(() => ({
    bankName: "",
    accountNumber: "",
    accountType: "CURRENT ACCOUNTS",
    last4: "",
    balance: 0,
    overdraftLimit: 0,
    overdraftUsed: 0,
    status: "Active",
    requiredPeriodStart: addMonths(accidentDate, -3),
    requiredPeriodEnd: accidentDate,
  }));

  // Update newAccount when dates change
  useEffect(() => {
    setNewAccount((prev) => ({
      ...prev,
      requiredPeriodStart,
      requiredPeriodEnd,
    }));
  }, [requiredPeriodStart, requiredPeriodEnd]);

  // Generate monthly breakdown for required period
  const generateMonthlyBreakdown = (start: Date, end: Date) => {
    const months: Array<{ month: number; year: number; startDate: Date; endDate: Date }> = [];
    let current = startOfMonth(start);

    while (current <= end) {
      const monthStart = current > start ? current : start;
      const monthEnd = endOfMonth(current) < end ? endOfMonth(current) : end;
      months.push({
        month: monthStart.getMonth() + 1,
        year: monthStart.getFullYear(),
        startDate: monthStart,
        endDate: monthEnd,
      });
      current = addMonths(current, 1);
    }

    return months;
  };

  // Fetch existing bank accounts
  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/claims/${claimId}/financial-step`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.bankAccounts) {
            const mappedAccounts = data.bankAccounts.map((acc: any) => ({
              id: acc.id,
              bankName: acc.bankName || "",
              accountNumber: acc.accountNumber || "",
              accountType: acc.accountType || "CURRENT ACCOUNTS",
              last4: acc.last4 || "",
              balance: acc.balance ? parseFloat(acc.balance.toString()) : 0,
              overdraftLimit: acc.overdraftLimit ? parseFloat(acc.overdraftLimit.toString()) : 0,
              overdraftUsed: acc.overdraftUsed ? parseFloat(acc.overdraftUsed.toString()) : 0,
              status: acc.status || "Active",
              requiredPeriodStart,
              requiredPeriodEnd,
              bankStatements: acc.bankStatements || [],
            }));
            setAccounts(mappedAccounts);
            // Load statements from database and calculate coverage
            const newStatements: Record<string, BankStatement[]> = {};
            mappedAccounts.forEach((acc: any, index: number) => {
              const accountId = acc.id || `account-${index}`;
              const months = generateMonthlyBreakdown(requiredPeriodStart, requiredPeriodEnd);
              const dbStatements = acc.bankStatements || [];
              
              newStatements[accountId] = months.map((m) => {
                // Find statements that cover this month period
                const coveringStatements = dbStatements.filter((stmt: any) => {
                  const stmtStart = new Date(stmt.startDate);
                  const stmtEnd = new Date(stmt.endDate);
                  return (stmtStart <= m.endDate && stmtEnd >= m.startDate);
                });
                
                if (coveringStatements.length > 0) {
                  // Calculate total days covered
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
            onAccountsChange?.(mappedAccounts.length);
          } else {
            // No financial step exists yet, set empty accounts
            setAccounts([]);
            setStatements({});
            onAccountsChange?.(0);
          }
        } else {
          onAccountsChange?.(0);
        }
      } catch (error) {
        console.error("Error fetching bank accounts:", error);
        onAccountsChange?.(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (claimId) {
      fetchBankAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const addAccount = () => {
    setShowAddForm(true);
    setEditingIndex(null);
  };

  const handleAddNewAccount = async () => {
    try {
      setIsSaving(true);
      // Add the new account to the list temporarily
      const updatedAccounts = [...accounts, { ...newAccount }];
      
      // Save all accounts (including the new one) to the database
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankAccounts: updatedAccounts.map((acc) => ({
            bankName: acc.bankName,
            accountNumber: acc.accountNumber,
            accountType: acc.accountType,
            last4: acc.last4,
            balance: acc.balance,
            overdraftLimit: acc.overdraftLimit,
            overdraftUsed: acc.overdraftUsed,
            status: acc.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save bank account");
      }

      const data = await response.json();
      
      // Update accounts with IDs from server
      if (data.bankAccounts) {
        setAccounts(data.bankAccounts.map((acc: any) => ({
          id: acc.id,
          bankName: acc.bankName || "",
          accountNumber: acc.accountNumber || "",
          accountType: acc.accountType || "CURRENT ACCOUNTS",
          balance: acc.balance ? parseFloat(acc.balance.toString()) : 0,
          overdraftUsed: acc.overdraftUsed ? parseFloat(acc.overdraftUsed.toString()) : 0,
          status: acc.status || "Active",
          requiredPeriodStart,
          requiredPeriodEnd,
        })));
        
        // Initialize statements for all accounts
        const newStatements: Record<string, BankStatement[]> = {};
        data.bankAccounts.forEach((acc: any, index: number) => {
          const accountId = acc.id || `account-${index}`;
          const months = generateMonthlyBreakdown(requiredPeriodStart, requiredPeriodEnd);
          newStatements[accountId] = months.map((m) => ({
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

      // Update count
      onAccountsChange?.(data.bankAccounts.length);

      // Reset form
      setNewAccount({
        bankName: "",
        accountNumber: "",
        accountType: "CURRENT ACCOUNTS",
        last4: "",
        balance: 0,
        overdraftLimit: 0,
        overdraftUsed: 0,
        status: "Active",
        requiredPeriodStart,
        requiredPeriodEnd,
      });
      setShowAddForm(false);
      toast.success("Bank account added successfully");
    } catch (error) {
      console.error("Error adding bank account:", error);
      toast.error("Failed to add bank account");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setEditingIndex(null);
  };

  const removeAccount = async (index: number) => {
    const account = accounts[index];
    const newAccounts = accounts.filter((_, i) => i !== index);
    setAccounts(newAccounts);
    const accountId = account.id || `account-${index}`;
    const newStatements = { ...statements };
    delete newStatements[accountId];
    setStatements(newStatements);

    // Save to database immediately
    try {
      setIsSaving(true);
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankAccounts: newAccounts.map((acc) => ({
            bankName: acc.bankName,
            accountNumber: acc.accountNumber,
            accountType: acc.accountType,
            last4: acc.last4,
            balance: acc.balance,
            overdraftLimit: acc.overdraftLimit,
            overdraftUsed: acc.overdraftUsed,
            status: acc.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete bank account");
      }

      const data = await response.json();
      // Update accounts with IDs from server
      if (data.bankAccounts) {
        setAccounts(data.bankAccounts.map((acc: any) => ({
          id: acc.id,
          bankName: acc.bankName || "",
          accountNumber: acc.accountNumber || "",
          accountType: acc.accountType || "CURRENT ACCOUNTS",
          balance: acc.balance ? parseFloat(acc.balance.toString()) : 0,
          overdraftUsed: acc.overdraftUsed ? parseFloat(acc.overdraftUsed.toString()) : 0,
          status: acc.status || "Active",
          requiredPeriodStart,
          requiredPeriodEnd,
        })));
        // Update count
        onAccountsChange?.(data.bankAccounts.length);
      }

      toast.success("Bank account deleted successfully");
    } catch (error) {
      console.error("Error deleting bank account:", error);
      toast.error("Failed to delete bank account");
      // Revert the change on error
      setAccounts(accounts);
    } finally {
      setIsSaving(false);
    }
  };

  const updateAccount = (index: number, field: keyof BankAccount, value: any) => {
    const newAccounts = [...accounts];
    newAccounts[index] = { ...newAccounts[index], [field]: value };
    setAccounts(newAccounts);
  };

  const handleOpenUploadModal = (accountIndex: number) => {
    setUploadingAccountIndex(accountIndex);
    setShowUploadModal(true);
    setStatementStartDate(undefined);
    setStatementEndDate(undefined);
    setUploadingFile(null);
    // Trigger file input
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
    if (!uploadingFile || uploadingAccountIndex === null || !statementStartDate || !statementEndDate) {
      toast.error("Please select a file and specify the statement period");
      return;
    }

    const account = accounts[uploadingAccountIndex];
    if (!account.id) {
      toast.error("Account must be saved before uploading statements");
      return;
    }

    try {
      setIsUploadingStatement(true);
      const formData = new FormData();
      formData.append("file", uploadingFile);
      formData.append("bankAccountId", account.id);
      formData.append("startDate", statementStartDate.toISOString());
      formData.append("endDate", statementEndDate.toISOString());

      const response = await fetch(`/api/claims/${claimId}/financial-step/bank-statements`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload statement");
      }

      // Refresh accounts and statements to update period coverage
      const financialStepResponse = await fetch(`/api/claims/${claimId}/financial-step`);
      if (financialStepResponse.ok) {
        const data = await financialStepResponse.json();
        if (data && data.bankAccounts) {
          const mappedAccounts = data.bankAccounts.map((acc: any) => ({
            id: acc.id,
            bankName: acc.bankName || "",
            accountNumber: acc.accountNumber || "",
            accountType: acc.accountType || "CURRENT ACCOUNTS",
            balance: acc.balance ? parseFloat(acc.balance.toString()) : 0,
            overdraftUsed: acc.overdraftUsed ? parseFloat(acc.overdraftUsed.toString()) : 0,
            status: acc.status || "Active",
            requiredPeriodStart,
            requiredPeriodEnd,
            bankStatements: acc.bankStatements || [],
          }));
          setAccounts(mappedAccounts);
          
          // Reload statements and update period coverage based on uploaded statements
          const newStatements: Record<string, BankStatement[]> = {};
          mappedAccounts.forEach((acc: any, index: number) => {
            const accountId = acc.id || `account-${index}`;
            const months = generateMonthlyBreakdown(requiredPeriodStart, requiredPeriodEnd);
            const dbStatements = acc.bankStatements || [];
            
            newStatements[accountId] = months.map((m) => {
              // Find statements that cover this month period
              const coveringStatements = dbStatements.filter((stmt: any) => {
                const stmtStart = new Date(stmt.startDate);
                const stmtEnd = new Date(stmt.endDate);
                // Check if statement overlaps with this month
                return (
                  (stmtStart <= m.endDate && stmtEnd >= m.startDate)
                );
              });
              
              if (coveringStatements.length > 0) {
                // Calculate total days covered by all statements for this month
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
      setUploadingAccountIndex(null);
      toast.success("Bank statement uploaded successfully");
    } catch (error) {
      console.error("Error uploading statement:", error);
      toast.error("Failed to upload bank statement");
    } finally {
      setIsUploadingStatement(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteStatement = async (accountIndex: number, statementId: string) => {
    try {
      const response = await fetch(`/api/claims/${claimId}/financial-step/bank-statements?statementId=${statementId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete statement");
      }

      // Refresh statements to update period coverage
      const account = accounts[accountIndex];
      if (account.id) {
        const financialStepResponse = await fetch(`/api/claims/${claimId}/financial-step`);
        if (financialStepResponse.ok) {
          const data = await financialStepResponse.json();
          if (data && data.bankAccounts) {
            const acc = data.bankAccounts.find((a: any) => a.id === account.id);
            if (acc) {
              const accountId = account.id;
              const months = generateMonthlyBreakdown(requiredPeriodStart, requiredPeriodEnd);
              const dbStatements = acc.bankStatements || [];
              
              setStatements({
                ...statements,
                [accountId]: months.map((m) => {
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

  const getCoverageStatus = (accountIndex: number) => {
    const accountId = `account-${accountIndex}`;
    const accountStatements = statements[accountId] || [];
    const totalMonths = accountStatements.length;
    const coveredMonths = accountStatements.filter((s) => s.uploaded).length;
    return { covered: coveredMonths, total: totalMonths };
  };

  const isIncomplete = (accountIndex: number) => {
    const status = getCoverageStatus(accountIndex);
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
          <Building2 className="size-5" />
          <h3 className="text-lg font-semibold">Bank Accounts</h3>
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Current Accounts</h3>
          <Button onClick={addAccount} size="sm" disabled={showAddForm}>
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </div>

        {/* List of Bank Accounts - Simple List View */}
        {accounts.length > 0 && (
          <div className="space-y-2">
            {accounts.map((account, accountIndex) => {
              const accountId = account.id || `account-${accountIndex}`;
              const accountStatements = statements[accountId] || [];
              const months = generateMonthlyBreakdown(requiredPeriodStart, requiredPeriodEnd);
              const coverage = getCoverageStatus(accountIndex);
              const isExpanded = expandedAccounts[accountIndex] || false;
              // Get actual uploaded statements from database (not monthly breakdown)
              const uploadedStatements = (account.bankStatements || []).map((stmt: any) => ({
                id: stmt.id,
                startDate: new Date(stmt.startDate),
                endDate: new Date(stmt.endDate),
                fileKey: stmt.fileKey,
                fileName: stmt.fileName,
                uploadedAt: stmt.uploadedAt ? new Date(stmt.uploadedAt) : undefined,
              }));

              return (
                <div key={accountIndex}>
                  {/* Account List Item - Clickable Row */}
                  <Card
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setExpandedAccounts({ ...expandedAccounts, [accountIndex]: !isExpanded })}
                  >
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium">
                          Account {accountIndex + 1} {account.status && `(${account.status})`}
                        </span>
                        {account.bankName && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">{account.bankName}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAccounts({ ...expandedAccounts, [accountIndex]: !isExpanded });
                          }}
                        >
                          {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAccount(accountIndex);
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Expanded Account Form */}
                  {isExpanded && (
                    <Card className="border-2 mt-2">
                      <CardContent className="space-y-4 pt-6">
                        {/* Account Fields */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Bank</Label>
                          <Input
                            placeholder="LLOYDS BANK CURRENT ACCOUNTS"
                            value={account.bankName}
                            onChange={(e) => updateAccount(accountIndex, "bankName", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Input
                            placeholder="CURRENT ACCOUNTS"
                            value={account.accountType}
                            onChange={(e) => updateAccount(accountIndex, "accountType", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Last 4</Label>
                          <Input
                            placeholder="1234"
                            maxLength={4}
                            value={account.last4}
                            onChange={(e) => updateAccount(accountIndex, "last4", e.target.value.replace(/\D/g, "").slice(0, 4))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Balance</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={account.balance}
                            onChange={(e) => updateAccount(accountIndex, "balance", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>O/D Limit</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={account.overdraftLimit}
                            onChange={(e) => updateAccount(accountIndex, "overdraftLimit", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>O/D Used</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={account.overdraftUsed}
                            onChange={(e) => updateAccount(accountIndex, "overdraftUsed", parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <Select
                            value={account.status}
                            onValueChange={(value) => updateAccount(accountIndex, "status", value)}
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

                      {/* Bank Statements Section */}
                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="size-4" />
                            <h4 className="font-medium">Bank Statements (3 Months Before Accident)</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                              {coverage.covered}/{coverage.total} months
                            </Badge>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenUploadModal(accountIndex)}
                              disabled={!account.id}
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
                            const statement = accountStatements[monthIndex] || {
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
                                      // Download the statement file
                                      const downloadUrl = `/api/claims/${claimId}/financial-step/bank-statements/download?fileKey=${encodeURIComponent(stmt.fileKey)}&fileName=${encodeURIComponent(stmt.fileName || "statement")}`;
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
                                        const downloadUrl = `/api/claims/${claimId}/financial-step/bank-statements/download?fileKey=${encodeURIComponent(stmt.fileKey)}&fileName=${encodeURIComponent(stmt.fileName || "statement")}`;
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
                                        const downloadUrl = `/api/claims/${claimId}/financial-step/bank-statements/download?fileKey=${encodeURIComponent(stmt.fileKey)}&fileName=${encodeURIComponent(stmt.fileName || "statement")}`;
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
                                      stmt.id && handleDeleteStatement(accountIndex, stmt.id);
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
                        {isIncomplete(accountIndex) && (
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

        {/* Add New Account Form */}
        {showAddForm && (
          <Card className="border-2 border-dashed">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Add New Bank Account</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancelAdd}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bank</Label>
                  <Input
                    placeholder="LLOYDS BANK CURRENT ACCOUNTS"
                    value={newAccount.bankName}
                    onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Input
                    placeholder="CURRENT ACCOUNTS"
                    value={newAccount.accountType}
                    onChange={(e) => setNewAccount({ ...newAccount, accountType: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last 4</Label>
                  <Input
                    placeholder="1234"
                    maxLength={4}
                    value={newAccount.last4}
                    onChange={(e) => setNewAccount({ ...newAccount, last4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Balance</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newAccount.balance}
                    onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>O/D Limit</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newAccount.overdraftLimit}
                    onChange={(e) => setNewAccount({ ...newAccount, overdraftLimit: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>O/D Used</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newAccount.overdraftUsed}
                    onChange={(e) => setNewAccount({ ...newAccount, overdraftUsed: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newAccount.status}
                    onValueChange={(value) => setNewAccount({ ...newAccount, status: value })}
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
                <Button onClick={handleAddNewAccount} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Account"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {accounts.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No bank accounts added yet</p>
            <Button onClick={addAccount} className="mt-4">
              <Plus className="mr-2 size-4" />
              Add Bank Account
            </Button>
          </div>
        )}
      </div>

      {/* Upload Statement Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Bank Statement</DialogTitle>
            <DialogDescription>Specify the period covered by this bank statement</DialogDescription>
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
