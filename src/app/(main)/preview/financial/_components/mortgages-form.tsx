"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, Loader2, X, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Mortgage = {
  id?: string;
  lender: string;
  balance: number;
  monthlyPayment: number;
  status: string;
};

type MortgagesFormProps = {
  claimId: string;
  onMortgagesChange?: (count: number) => void;
};

export function MortgagesForm({ claimId, onMortgagesChange }: MortgagesFormProps) {
  const [mortgages, setMortgages] = useState<Mortgage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newMortgage, setNewMortgage] = useState<Mortgage>({
    lender: "",
    balance: 0,
    monthlyPayment: 0,
    status: "Active",
  });

  // Fetch existing mortgages
  useEffect(() => {
    const fetchMortgages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/claims/${claimId}/financial-step`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.mortgages) {
            const mappedMortgages = data.mortgages.map((mortgage: any) => ({
              id: mortgage.id,
              lender: mortgage.lender || "",
              balance: mortgage.balance ? parseFloat(mortgage.balance.toString()) : 0,
              monthlyPayment: mortgage.monthlyPayment ? parseFloat(mortgage.monthlyPayment.toString()) : 0,
              status: mortgage.status || "Active",
            }));
            setMortgages(mappedMortgages);
            onMortgagesChange?.(mappedMortgages.length);
          } else {
            setMortgages([]);
            onMortgagesChange?.(0);
          }
        } else {
          onMortgagesChange?.(0);
        }
      } catch (error) {
        console.error("Error fetching mortgages:", error);
        onMortgagesChange?.(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (claimId) {
      fetchMortgages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const addMortgage = () => {
    setShowAddForm(true);
  };

  const handleAddNewMortgage = async () => {
    try {
      setIsSaving(true);
      const updatedMortgages = [...mortgages, { ...newMortgage }];
      
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mortgages: updatedMortgages.map((mortgage) => ({
            lender: mortgage.lender,
            balance: mortgage.balance,
            monthlyPayment: mortgage.monthlyPayment,
            status: mortgage.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save mortgage");
      }

      const data = await response.json();
      
      if (data.mortgages) {
        setMortgages(data.mortgages.map((mortgage: any) => ({
          id: mortgage.id,
          lender: mortgage.lender || "",
          balance: mortgage.balance ? parseFloat(mortgage.balance.toString()) : 0,
          monthlyPayment: mortgage.monthlyPayment ? parseFloat(mortgage.monthlyPayment.toString()) : 0,
          status: mortgage.status || "Active",
        })));
      }

      onMortgagesChange?.(data.mortgages.length);

      setNewMortgage({
        lender: "",
        balance: 0,
        monthlyPayment: 0,
        status: "Active",
      });
      setShowAddForm(false);
      toast.success("Mortgage added successfully");
    } catch (error) {
      console.error("Error adding mortgage:", error);
      toast.error("Failed to add mortgage");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  const removeMortgage = async (index: number) => {
    const mortgage = mortgages[index];
    const newMortgages = mortgages.filter((_, i) => i !== index);
    setMortgages(newMortgages);

    try {
      setIsSaving(true);
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mortgages: newMortgages.map((mortgage) => ({
            lender: mortgage.lender,
            balance: mortgage.balance,
            monthlyPayment: mortgage.monthlyPayment,
            status: mortgage.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete mortgage");
      }

      const data = await response.json();
      if (data.mortgages) {
        setMortgages(data.mortgages.map((mortgage: any) => ({
          id: mortgage.id,
          lender: mortgage.lender || "",
          balance: mortgage.balance ? parseFloat(mortgage.balance.toString()) : 0,
          monthlyPayment: mortgage.monthlyPayment ? parseFloat(mortgage.monthlyPayment.toString()) : 0,
          status: mortgage.status || "Active",
        })));
        onMortgagesChange?.(data.mortgages.length);
      }

      toast.success("Mortgage deleted successfully");
    } catch (error) {
      console.error("Error deleting mortgage:", error);
      toast.error("Failed to delete mortgage");
      setMortgages(mortgages);
    } finally {
      setIsSaving(false);
    }
  };

  const updateMortgage = async (index: number, field: keyof Mortgage, value: any) => {
    const newMortgages = [...mortgages];
    newMortgages[index] = { ...newMortgages[index], [field]: value };
    setMortgages(newMortgages);

    // Save to database immediately
    try {
      setIsSaving(true);
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mortgages: newMortgages.map((mortgage) => ({
            lender: mortgage.lender,
            balance: mortgage.balance,
            monthlyPayment: mortgage.monthlyPayment,
            status: mortgage.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update mortgage");
      }

      const data = await response.json();
      if (data.mortgages) {
        setMortgages(data.mortgages.map((mortgage: any) => ({
          id: mortgage.id,
          lender: mortgage.lender || "",
          balance: mortgage.balance ? parseFloat(mortgage.balance.toString()) : 0,
          monthlyPayment: mortgage.monthlyPayment ? parseFloat(mortgage.monthlyPayment.toString()) : 0,
          status: mortgage.status || "Active",
        })));
      }
    } catch (error) {
      console.error("Error updating mortgage:", error);
      toast.error("Failed to update mortgage");
      // Revert on error
      setMortgages(mortgages);
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
          <Home className="size-5" />
          <h3 className="text-lg font-semibold">Mortgages</h3>
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Mortgage Properties</h3>
          <Button onClick={addMortgage} size="sm" disabled={showAddForm}>
            <Plus className="mr-2 size-4" />
            Add Mortgage
          </Button>
        </div>

        {/* List of Mortgages */}
        {mortgages.length > 0 && (
          <div className="space-y-3">
            {mortgages.map((mortgage, mortgageIndex) => (
              <Card key={mortgageIndex} className="border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg">Mortgage {mortgageIndex + 1}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => removeMortgage(mortgageIndex)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Lender</Label>
                      <Input
                        placeholder="Lender"
                        value={mortgage.lender}
                        onChange={(e) => updateMortgage(mortgageIndex, "lender", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Balance</Label>
                      <Input
                        type="number"
                        placeholder="Balance"
                        value={mortgage.balance}
                        onChange={(e) => updateMortgage(mortgageIndex, "balance", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Payment</Label>
                      <Input
                        type="number"
                        placeholder="Monthly Payment"
                        value={mortgage.monthlyPayment}
                        onChange={(e) => updateMortgage(mortgageIndex, "monthlyPayment", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={mortgage.status}
                        onValueChange={(value) => updateMortgage(mortgageIndex, "status", value)}
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

        {/* Add New Mortgage Form */}
        {showAddForm && (
          <Card className="border-2 border-dashed">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Add New Mortgage</CardTitle>
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
                    value={newMortgage.lender}
                    onChange={(e) => setNewMortgage({ ...newMortgage, lender: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Balance</Label>
                  <Input
                    type="number"
                    placeholder="Balance"
                    value={newMortgage.balance}
                    onChange={(e) => setNewMortgage({ ...newMortgage, balance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monthly Payment</Label>
                  <Input
                    type="number"
                    placeholder="Monthly Payment"
                    value={newMortgage.monthlyPayment}
                    onChange={(e) => setNewMortgage({ ...newMortgage, monthlyPayment: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newMortgage.status}
                    onValueChange={(value) => setNewMortgage({ ...newMortgage, status: value })}
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
                <Button onClick={handleAddNewMortgage} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Mortgage"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {mortgages.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Home className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No mortgages added yet</p>
            <Button onClick={addMortgage} className="mt-4">
              <Plus className="mr-2 size-4" />
              Add Mortgage
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
