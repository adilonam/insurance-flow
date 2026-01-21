"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, Loader2, X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type HirePurchaseAgreement = {
  id?: string;
  lender: string;
  balance: number;
  monthlyPayment: number;
  status: string;
};

type HirePurchaseFormProps = {
  claimId: string;
  onAgreementsChange?: (count: number) => void;
};

export function HirePurchaseForm({ claimId, onAgreementsChange }: HirePurchaseFormProps) {
  const [agreements, setAgreements] = useState<HirePurchaseAgreement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newAgreement, setNewAgreement] = useState<HirePurchaseAgreement>({
    lender: "",
    balance: 0,
    monthlyPayment: 0,
    status: "Active",
  });

  // Fetch existing hire purchase agreements
  useEffect(() => {
    const fetchAgreements = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/claims/${claimId}/financial-step`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.hirePurchaseAgreements) {
            const mappedAgreements = data.hirePurchaseAgreements.map((agreement: any) => ({
              id: agreement.id,
              lender: agreement.lender || "",
              balance: agreement.balance ? parseFloat(agreement.balance.toString()) : 0,
              monthlyPayment: agreement.monthlyPayment ? parseFloat(agreement.monthlyPayment.toString()) : 0,
              status: agreement.status || "Active",
            }));
            setAgreements(mappedAgreements);
            onAgreementsChange?.(mappedAgreements.length);
          } else {
            setAgreements([]);
            onAgreementsChange?.(0);
          }
        } else {
          onAgreementsChange?.(0);
        }
      } catch (error) {
        console.error("Error fetching hire purchase agreements:", error);
        onAgreementsChange?.(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (claimId) {
      fetchAgreements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const addAgreement = () => {
    setShowAddForm(true);
  };

  const handleAddNewAgreement = async () => {
    try {
      setIsSaving(true);
      const updatedAgreements = [...agreements, { ...newAgreement }];
      
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hirePurchaseAgreements: updatedAgreements.map((agreement) => ({
            lender: agreement.lender,
            balance: agreement.balance,
            monthlyPayment: agreement.monthlyPayment,
            status: agreement.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save hire purchase agreement");
      }

      const data = await response.json();
      
      if (data.hirePurchaseAgreements) {
        setAgreements(data.hirePurchaseAgreements.map((agreement: any) => ({
          id: agreement.id,
          lender: agreement.lender || "",
          balance: agreement.balance ? parseFloat(agreement.balance.toString()) : 0,
          monthlyPayment: agreement.monthlyPayment ? parseFloat(agreement.monthlyPayment.toString()) : 0,
          status: agreement.status || "Active",
        })));
      }

      onAgreementsChange?.(data.hirePurchaseAgreements.length);

      setNewAgreement({
        lender: "",
        balance: 0,
        monthlyPayment: 0,
        status: "Active",
      });
      setShowAddForm(false);
      toast.success("Hire purchase agreement added successfully");
    } catch (error) {
      console.error("Error adding hire purchase agreement:", error);
      toast.error("Failed to add hire purchase agreement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  const removeAgreement = async (index: number) => {
    const agreement = agreements[index];
    const newAgreements = agreements.filter((_, i) => i !== index);
    setAgreements(newAgreements);

    try {
      setIsSaving(true);
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hirePurchaseAgreements: newAgreements.map((agreement) => ({
            lender: agreement.lender,
            balance: agreement.balance,
            monthlyPayment: agreement.monthlyPayment,
            status: agreement.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete hire purchase agreement");
      }

      const data = await response.json();
      if (data.hirePurchaseAgreements) {
        setAgreements(data.hirePurchaseAgreements.map((agreement: any) => ({
          id: agreement.id,
          lender: agreement.lender || "",
          balance: agreement.balance ? parseFloat(agreement.balance.toString()) : 0,
          monthlyPayment: agreement.monthlyPayment ? parseFloat(agreement.monthlyPayment.toString()) : 0,
          status: agreement.status || "Active",
        })));
        onAgreementsChange?.(data.hirePurchaseAgreements.length);
      }

      toast.success("Hire purchase agreement deleted successfully");
    } catch (error) {
      console.error("Error deleting hire purchase agreement:", error);
      toast.error("Failed to delete hire purchase agreement");
      setAgreements(agreements);
    } finally {
      setIsSaving(false);
    }
  };

  const updateAgreement = async (index: number, field: keyof HirePurchaseAgreement, value: any) => {
    const newAgreements = [...agreements];
    newAgreements[index] = { ...newAgreements[index], [field]: value };
    setAgreements(newAgreements);

    // Save to database immediately
    try {
      setIsSaving(true);
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hirePurchaseAgreements: newAgreements.map((agreement) => ({
            lender: agreement.lender,
            balance: agreement.balance,
            monthlyPayment: agreement.monthlyPayment,
            status: agreement.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update hire purchase agreement");
      }

      const data = await response.json();
      if (data.hirePurchaseAgreements) {
        setAgreements(data.hirePurchaseAgreements.map((agreement: any) => ({
          id: agreement.id,
          lender: agreement.lender || "",
          balance: agreement.balance ? parseFloat(agreement.balance.toString()) : 0,
          monthlyPayment: agreement.monthlyPayment ? parseFloat(agreement.monthlyPayment.toString()) : 0,
          status: agreement.status || "Active",
        })));
      }
    } catch (error) {
      console.error("Error updating hire purchase agreement:", error);
      toast.error("Failed to update hire purchase agreement");
      // Revert on error
      setAgreements(agreements);
    } finally {
      setIsSaving(false);
    }
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
          <ShoppingCart className="size-5" />
          <h3 className="text-lg font-semibold">Hire Purchase Agreements</h3>
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Hire Purchase</h3>
          <Button onClick={addAgreement} size="sm" disabled={showAddForm}>
            <Plus className="mr-2 size-4" />
            Add Agreement
          </Button>
        </div>

        {/* List of Hire Purchase Agreements */}
        {agreements.length > 0 && (
          <div className="space-y-3">
            {agreements.map((agreement, agreementIndex) => (
              <Card key={agreementIndex} className="border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg">Agreement {agreementIndex + 1}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => removeAgreement(agreementIndex)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Lender</Label>
                      <Input
                        placeholder="Lender"
                        value={agreement.lender}
                        onChange={(e) => updateAgreement(agreementIndex, "lender", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Balance</Label>
                      <Input
                        type="number"
                        placeholder="Balance"
                        value={agreement.balance}
                        onChange={(e) => updateAgreement(agreementIndex, "balance", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Payment</Label>
                      <Input
                        type="number"
                        placeholder="Monthly Payment"
                        value={agreement.monthlyPayment}
                        onChange={(e) => updateAgreement(agreementIndex, "monthlyPayment", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={agreement.status}
                        onValueChange={(value) => updateAgreement(agreementIndex, "status", value)}
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add New Agreement Form */}
        {showAddForm && (
          <Card className="border-2 border-dashed">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Add New Hire Purchase Agreement</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleCancelAdd}>
                <X className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Lender</Label>
                  <Input
                    placeholder="Lender"
                    value={newAgreement.lender}
                    onChange={(e) => setNewAgreement({ ...newAgreement, lender: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Balance</Label>
                  <Input
                    type="number"
                    placeholder="Balance"
                    value={newAgreement.balance}
                    onChange={(e) => setNewAgreement({ ...newAgreement, balance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Payment</Label>
                  <Input
                    type="number"
                    placeholder="Monthly Payment"
                    value={newAgreement.monthlyPayment}
                    onChange={(e) => setNewAgreement({ ...newAgreement, monthlyPayment: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newAgreement.status}
                    onValueChange={(value) => setNewAgreement({ ...newAgreement, status: value })}
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
                <Button onClick={handleAddNewAgreement} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Agreement"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {agreements.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ShoppingCart className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hire purchase agreements added yet</p>
            <Button onClick={addAgreement} className="mt-4">
              <Plus className="mr-2 size-4" />
              Add Agreement
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
