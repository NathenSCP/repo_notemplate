tableextension 50400 "RDV Company Information" extends "Company Information"
{
    fields
    {
        field(50000; "SCP Approve Key"; Blob)
        {
            Caption = 'Approve Key';
            DataClassification = ToBeClassified;
        }
        field(50001; "SCP Signature Password"; Blob)
        {
            Caption = 'Signature Password';
            DataClassification = ToBeClassified;
        }
    }
}