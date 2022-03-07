tableextension 50403 "RDV Bank Account" extends "Bank Account"
{
    fields
    {
        field(50000; "SCP First Signature"; Blob)
        {
            Caption = 'First Signature';
            Subtype = Bitmap;
            DataClassification = ToBeClassified;
        }
        field(50001; "SCP Second Signature"; Blob)
        {
            Caption = 'Second Signature';
            Subtype = Bitmap;
            DataClassification = ToBeClassified;
        }
        field(50002; "SCP Max Amount with Signature"; Decimal)
        {
            Caption = 'Max Amount Auto Signature';
            DataClassification = ToBeClassified;
        }
        field(50003; "SCP Bank Name"; Text[100])
        {
            Caption = 'Bank Full Name';
            DataClassification = ToBeClassified;
        }
    }
}