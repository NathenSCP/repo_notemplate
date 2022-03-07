tableextension 50401 "RDV Gen. Journal Line" extends "Gen. Journal Line"
{
    fields
    {
        field(50000; "SCP Print with Sign. Approved"; Boolean)
        {
            Caption = 'Print Auto Signature Approved';
            DataClassification = ToBeClassified;
        }
        field(50001; "SCP Created by"; Code[50])
        {
            Caption = 'Created by';
            DataClassification = ToBeClassified;
        }
        field(50002; "SCP Approved by"; Code[50])
        {
            Caption = 'Approved by';
            DataClassification = ToBeClassified;
        }
    }
}