"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, Loader2, X, CreditCard as LoanIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Loan = {
  id?: string;
  lender: string;
  balance: number;
  status: string;
};

type LoansFormProps = {
  claimId: string;
  onLoansChange?: (count: number) => void;
};

export function LoansForm({ claimId, onLoansChange }: LoansFormProps) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newLoan, setNewLoan] = useState<Loan>({
    lender: "",
    balance: 0,
    status: "Active",
  });

  // Fetch existing loans
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/claims/${claimId}/financial-step`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.loans) {
            const mappedLoans = data.loans.map((loan: any) => ({
              id: loan.id,
              lender: loan.lender || "",
              balance: loan.balance ? parseFloat(loan.balance.toString()) : 0,
              status: loan.status || "Active",
            }));
            setLoans(mappedLoans);
            onLoansChange?.(mappedLoans.length);
          } else {
            setLoans([]);
            onLoansChange?.(0);
          }
        } else {
          onLoansChange?.(0);
        }
      } catch (error) {
        console.error("Error fetching loans:", error);
        onLoansChange?.(0);
      } finally {
        setIsLoading(false);
      }
    };

    if (claimId) {
      fetchLoans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimId]);

  const addLoan = () => {
    setShowAddForm(true);
  };

  const handleAddNewLoan = async () => {
    try {
      setIsSaving(true);
      const updatedLoans = [...loans, { ...newLoan }];
      
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loans: updatedLoans.map((loan) => ({
            lender: loan.lender,
            balance: loan.balance,
            status: loan.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save loan");
      }

      const data = await response.json();
      
      if (data.loans) {
        setLoans(data.loans.map((loan: any) => ({
          id: loan.id,
          lender: loan.lender || "",
          balance: loan.balance ? parseFloat(loan.balance.toString()) : 0,
          status: loan.status || "Active",
        })));
      }

      onLoansChange?.(data.loans.length);

      setNewLoan({
        lender: "",
        balance: 0,
        status: "Active",
      });
      setShowAddForm(false);
      toast.success("Loan added successfully");
    } catch (error) {
      console.error("Error adding loan:", error);
      toast.error("Failed to add loan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
  };

  const removeLoan = async (index: number) => {
    const loan = loans[index];
    const newLoans = loans.filter((_, i) => i !== index);
    setLoans(newLoans);

    try {
      setIsSaving(true);
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loans: newLoans.map((loan) => ({
            lender: loan.lender,
            balance: loan.balance,
            status: loan.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete loan");
      }

      const data = await response.json();
      if (data.loans) {
        setLoans(data.loans.map((loan: any) => ({
          id: loan.id,
          lender: loan.lender || "",
          balance: loan.balance ? parseFloat(loan.balance.toString()) : 0,
          status: loan.status || "Active",
        })));
        onLoansChange?.(data.loans.length);
      }

      toast.success("Loan deleted successfully");
    } catch (error) {
      console.error("Error deleting loan:", error);
      toast.error("Failed to delete loan");
      setLoans(loans);
    } finally {
      setIsSaving(false);
    }
  };

  const updateLoan = async (index: number, field: keyof Loan, value: any) => {
    const newLoans = [...loans];
    newLoans[index] = { ...newLoans[index], [field]: value };
    setLoans(newLoans);

    // Save to database immediately
    try {
      setIsSaving(true);
      const response = await fetch(`/api/claims/${claimId}/financial-step`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loans: newLoans.map((loan) => ({
            lender: loan.lender,
            balance: loan.balance,
            status: loan.status,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update loan");
      }

      const data = await response.json();
      if (data.loans) {
        setLoans(data.loans.map((loan: any) => ({
          id: loan.id,
          lender: loan.lender || "",
          balance: loan.balance ? parseFloat(loan.balance.toString()) : 0,
          status: loan.status || "Active",
        })));
      }
    } catch (error) {
      console.error("Error updating loan:", error);
      toast.error("Failed to update loan");
      // Revert on error
      setLoans(loans);
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
          <LoanIcon className="size-5" />
          <h3 className="text-lg font-semibold">Loans</h3>
        </div>
      </div>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Current Loans</h3>
          <Button onClick={addLoan} size="sm" disabled={showAddForm}>
            <Plus className="mr-2 size-4" />
            Add
          </Button>
        </div>

        {/* List of Loans */}
        {loans.length > 0 && (
          <div className="space-y-3">
            {loans.map((loan, loanIndex) => (
              <Card key={loanIndex} className="border">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-lg">Loan {loanIndex + 1}</CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => removeLoan(loanIndex)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Lender</Label>
                      <Input
                        placeholder="Lender"
                        value={loan.lender}
                        onChange={(e) => updateLoan(loanIndex, "lender", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Balance</Label>
                      <Input
                        type="number"
                        placeholder="Balance"
                        value={loan.balance}
                        onChange={(e) => updateLoan(loanIndex, "balance", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={loan.status}
                        onValueChange={(value) => updateLoan(loanIndex, "status", value)}
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

        {/* Add New Loan Form */}
        {showAddForm && (
          <Card className="border-2 border-dashed">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Add New Loan</CardTitle>
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
                    value={newLoan.lender}
                    onChange={(e) => setNewLoan({ ...newLoan, lender: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Balance</Label>
                  <Input
                    type="number"
                    placeholder="Balance"
                    value={newLoan.balance}
                    onChange={(e) => setNewLoan({ ...newLoan, balance: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newLoan.status}
                    onValueChange={(value) => setNewLoan({ ...newLoan, status: value })}
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
                <Button onClick={handleAddNewLoan} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Loan"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {loans.length === 0 && !showAddForm && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <LoanIcon className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No loans added yet</p>
            <Button onClick={addLoan} className="mt-4">
              <Plus className="mr-2 size-4" />
              Add Loan
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
