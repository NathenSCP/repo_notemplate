tableextension 50402 "RDV User Setup" extends "User Setup"
{
    fields
    {
        field(50000; "SCP Approve Print with Sign."; Blob)
        {
            Caption = 'Approve Print Auto Signature';
            DataClassification = ToBeClassified;
        }
    }
}