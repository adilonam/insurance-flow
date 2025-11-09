"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { initialAssessmentSchema } from "../../_components/schema";

const formSchema = initialAssessmentSchema;

type FormValues = z.infer<typeof formSchema>;

interface InitialAssessmentFormProps {
  initialData?: Partial<FormValues>;
  caseId: string;
  onSave?: (data: FormValues) => void;
}

export function InitialAssessmentForm({ initialData, caseId, onSave }: InitialAssessmentFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {},
  });

  const onSubmit = async (data: FormValues) => {
    try {
      // In a real app, this would save to the backend
      console.log("Initial Assessment Data:", data);
      toast.success("Initial Assessment saved successfully");
      onSave?.(data);
    } catch (error) {
      toast.error("Failed to save Initial Assessment");
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Initial Assessment Section */}
        <Card>
          <CardHeader>
            <CardTitle>Initial Assessment</CardTitle>
            <CardDescription>Basic information about the claim and claimant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="claimReference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claim Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter claim reference" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="postCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter post code" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateMovedIn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Moved In</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="niNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NI Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter NI number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="dlNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DL Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter driving licence number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dlIssue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DL Issue Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dlExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>DL Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="claimantContactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claimant Contact Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter contact number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="emailAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accidentLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accident Location</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter accident location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accidentCircumstances"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accident Circumstances</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the accident circumstances" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dateOfAccident"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Accident</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timeOfAccident"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time of Accident</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="livedInCurrentAddress3Years"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lived in current address for 3 years or more?</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Yes or No" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Y">Yes</SelectItem>
                        <SelectItem value="N">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="address2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address 2</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter address 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address2Dates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address 2 Dates of Stay</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter dates of stay" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="address3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address 3</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter address 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address3Dates"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address 3 Dates of Stay</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter dates of stay" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Defendant Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Defendant Details</CardTitle>
            <CardDescription>Information about the defendant</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="defendantName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Defendant Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter defendant name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defendantReg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Defendant Registration</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter defendant registration" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="defendantContactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Defendant Contact Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter contact number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defendantMakeModelColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Defendant Make & Model & Color</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter make, model and color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Claimant Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Claimant Details</CardTitle>
            <CardDescription>Information about the claimant and their vehicle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="claimantVehicleRegistration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claimant Vehicle Registration</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vehicle registration" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="claimantInsurer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Claimant Insurer</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter insurer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="claimantMakeModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claimant Make and Model</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter make and model" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mainPolicyHolder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main policy holder on insurance?</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Yes or No" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Y">Yes</SelectItem>
                        <SelectItem value="N">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="additionalDriver1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Driver 1</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="additionalDriver2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Driver 2</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="additionalDriver3"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Driver 3</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="noClaimsBonus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No Claims Bonus?</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Yes or No" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="insuranceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fully Comp / TPFT / TP</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select insurance type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fully Comp">Fully Comp</SelectItem>
                          <SelectItem value="TPFT">TPFT</SelectItem>
                          <SelectItem value="TP">TP</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dateLicenceObtained"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Licence Obtained</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="occupation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupation</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter occupation" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="ukResidentFromBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Have you been a UK Resident from Birth?</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Yes or No" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ukResidentSince"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>If not, from when?</FormLabel>
                    <FormControl>
                      <Input type="date" placeholder="Enter date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="vehicleValidMOTAndTax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle has Valid MOT & road tax?</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Yes or No" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="everDeclaredBankrupt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ever been declared bankrupt?</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Yes or No" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="claimantClaimingInjury"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Claimant claiming injury?</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Yes or No" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Y">Yes</SelectItem>
                        <SelectItem value="N">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalInformation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter any additional information" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accessToOtherVehicles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Have you got access to other vehicles? (Either a named driver on / Other Logbook registered in your
                    name / pay for any road tax or insurance for other vehicles?)
                  </FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter details" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="ownTheVehicle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Do you own the Vehicle?</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Yes or No" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vehicleOwnerRelationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>If no, relationship?</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter relationship" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="carOnFinance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Is the car on Finance?</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Yes or No" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="workInMotorTrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work in the motor trade?</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Yes or No" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Y">Yes</SelectItem>
                          <SelectItem value="N">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="needForPrestigeVehicle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Need for prestige vehicle if you have one?</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Yes or No" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Y">Yes</SelectItem>
                        <SelectItem value="N">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Private Hire Driver Section */}
        <Card>
          <CardHeader>
            <CardTitle>If Private Hire Driver</CardTitle>
            <CardDescription>Additional information for private hire drivers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="privateHireLicenceYears"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How long have you held your Private hire Licence</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter number of years" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxiIncomePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What percent of your income comes from taxi</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter percentage" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="additionalEmployment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Employment?</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter additional employment details" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Witness Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>Witness Details</CardTitle>
            <CardDescription>Information about any witnesses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="witnessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter witness name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="witnessContactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="Enter contact number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="witnessDetailsObtained"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How details were obtained</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter how witness details were obtained" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="witnessRelationToClaimant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Any relation to claimant</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter relationship" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="witnessAdditionalInformation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter any additional witness information" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Insurance Eligibility Questions Section */}
        <Card>
          <CardHeader>
            <CardTitle>Insurance Eligibility Questions</CardTitle>
            <CardDescription>
              Must be able to answer yes to all questions or must be referred to insurer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nonStandardDriver"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Non Standard Driver?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="agedBetween25And70"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Aged Between 25 - 70?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fullUKOrEUDrivingLicense2Years"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>FULL UK/EU Driving License Minimum 2 Years?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxiLicence1Year"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Taxi Licence: Minimum 1 year (If Applicable)</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ukResident3Years"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      You have been continuously resident in the United Kingdom for a minimum period of 3 years.
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noMoreThan9PenaltyPoints"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Have not during the last 3 years been convicted of or has a pending prosecution for any offence or
                      combination of offences: which result or may result in more than 9 penalty points being endorsed
                      on his/her driving licence. which result or may result in a loss of licence or suspension/ban from
                      driving.
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notBannedFromDriving5Years"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Not banned from driving within the past 5 years</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noMoreThan1FaultClaim2Years"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>No more than 1 fault claim within the past 2 years</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noNonSpentCriminalConvictions"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>You do not have no non-spent criminal convictions</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noDisabilityOrMedicalCondition"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Not suffered from any disability or medical condition which has not been notified to, is
                      notifiable, the Driver Vehicle Licencing Authority or which has been notified but resulted in the
                      refusal of a driving licence for the class of vehicle to be driven
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit">Save Initial Assessment</Button>
        </div>
      </form>
    </Form>
  );
}
