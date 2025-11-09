"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Prisma } from "@/generated/prisma/client";

type InitialAssessment = Prisma.InitialAssessmentGetPayload<{}>;

interface InitialAssessmentDisplayProps {
  data: InitialAssessment;
}

export function InitialAssessmentDisplay({ data }: InitialAssessmentDisplayProps) {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "Not provided";
    try {
      return format(new Date(date), "PPP");
    } catch {
      return "Invalid date";
    }
  };

  const formatDateTime = (date: Date | null | undefined) => {
    if (!date) return "Not provided";
    try {
      return format(new Date(date), "PPP p");
    } catch {
      return "Invalid date";
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Claim and claimant basic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Claim Reference</div>
              <p className="mt-1">{data.claimReference || "Not provided"}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Full Name</div>
              <p className="mt-1">{data.fullName || "Not provided"}</p>
            </div>
          </div>

          <div>
            <div className="text-muted-foreground text-sm font-medium">Address</div>
            <p className="mt-1">{data.address || "Not provided"}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Post Code</div>
              <p className="mt-1">{data.postCode || "Not provided"}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Date Moved In</div>
              <p className="mt-1">{formatDate(data.dateMovedIn)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Date of Birth</div>
              <p className="mt-1">{formatDate(data.dateOfBirth)}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">NI Number</div>
              <p className="mt-1">{data.niNumber || "Not provided"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <div className="text-muted-foreground text-sm font-medium">DL Number</div>
              <p className="mt-1">{data.dlNumber || "Not provided"}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">DL Issue Date</div>
              <p className="mt-1">{formatDate(data.dlIssue)}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">DL Expiry Date</div>
              <p className="mt-1">{formatDate(data.dlExpiry)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Contact Number</div>
              <p className="mt-1">{data.claimantContactNumber || "Not provided"}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Email Address</div>
              <p className="mt-1">{data.emailAddress || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accident Details */}
      <Card>
        <CardHeader>
          <CardTitle>Accident Details</CardTitle>
          <CardDescription>Information about the accident</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-muted-foreground text-sm font-medium">Accident Location</div>
            <p className="mt-1">{data.accidentLocation || "Not provided"}</p>
          </div>

          <div>
            <div className="text-muted-foreground text-sm font-medium">Accident Circumstances</div>
            <p className="mt-1">{data.accidentCircumstances || "Not provided"}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Date of Accident</div>
              <p className="mt-1">{formatDate(data.dateOfAccident)}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Time of Accident</div>
              <p className="mt-1">{data.timeOfAccident || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Defendant Details */}
      <Card>
        <CardHeader>
          <CardTitle>Defendant Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Defendant Name</div>
              <p className="mt-1">{data.defendantName || "Not provided"}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Defendant Registration</div>
              <p className="mt-1">{data.defendantReg || "Not provided"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Defendant Contact Number</div>
              <p className="mt-1">{data.defendantContactNumber || "Not provided"}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Make, Model & Color</div>
              <p className="mt-1">{data.defendantMakeModelColor || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Claimant Vehicle Details */}
      <Card>
        <CardHeader>
          <CardTitle>Claimant Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Vehicle Registration</div>
              <p className="mt-1">{data.claimantVehicleRegistration || "Not provided"}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Insurer</div>
              <p className="mt-1">{data.claimantInsurer || "Not provided"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Make & Model</div>
              <p className="mt-1">{data.claimantMakeModel || "Not provided"}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Insurance Type</div>
              <p className="mt-1">{data.insuranceType || "Not provided"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Main Policy Holder</div>
              <p className="mt-1">{data.mainPolicyHolder || "Not provided"}</p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">No Claims Bonus</div>
              <p className="mt-1">{data.noClaimsBonus || "Not provided"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insurance Eligibility Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Insurance Eligibility Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-muted-foreground text-sm font-medium">Non-Standard Driver</div>
              <p className="mt-1">
                {data.nonStandardDriver ? "Yes" : data.nonStandardDriver === false ? "No" : "Not provided"}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Aged Between 25 and 70</div>
              <p className="mt-1">
                {data.agedBetween25And70 ? "Yes" : data.agedBetween25And70 === false ? "No" : "Not provided"}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Full UK/EU Driving License (2 Years)</div>
              <p className="mt-1">
                {data.fullUKOrEUDrivingLicense2Years
                  ? "Yes"
                  : data.fullUKOrEUDrivingLicense2Years === false
                    ? "No"
                    : "Not provided"}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Taxi Licence (1 Year)</div>
              <p className="mt-1">
                {data.taxiLicence1Year ? "Yes" : data.taxiLicence1Year === false ? "No" : "Not provided"}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">UK Resident (3 Years)</div>
              <p className="mt-1">
                {data.ukResident3Years ? "Yes" : data.ukResident3Years === false ? "No" : "Not provided"}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">No More Than 9 Penalty Points</div>
              <p className="mt-1">
                {data.noMoreThan9PenaltyPoints
                  ? "Yes"
                  : data.noMoreThan9PenaltyPoints === false
                    ? "No"
                    : "Not provided"}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">Not Banned From Driving (5 Years)</div>
              <p className="mt-1">
                {data.notBannedFromDriving5Years
                  ? "Yes"
                  : data.notBannedFromDriving5Years === false
                    ? "No"
                    : "Not provided"}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">No More Than 1 Fault Claim (2 Years)</div>
              <p className="mt-1">
                {data.noMoreThan1FaultClaim2Years
                  ? "Yes"
                  : data.noMoreThan1FaultClaim2Years === false
                    ? "No"
                    : "Not provided"}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">No Non-Spent Criminal Convictions</div>
              <p className="mt-1">
                {data.noNonSpentCriminalConvictions
                  ? "Yes"
                  : data.noNonSpentCriminalConvictions === false
                    ? "No"
                    : "Not provided"}
              </p>
            </div>
            <div>
              <div className="text-muted-foreground text-sm font-medium">No Disability or Medical Condition</div>
              <p className="mt-1">
                {data.noDisabilityOrMedicalCondition
                  ? "Yes"
                  : data.noDisabilityOrMedicalCondition === false
                    ? "No"
                    : "Not provided"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
