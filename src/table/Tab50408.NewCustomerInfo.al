/// <summary>
/// Table NewCustomerInfo (ID 50408).
/// </summary>
table 50408 NewCustomerInfo
{
    Caption = 'NewCustomerInfo';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Customer Name"; Text[250])
        {
            Caption = 'Customer Name';
            DataClassification = ToBeClassified;
        }
        field(2; Address; Text[100])
        {
            Caption = 'Address';
        }
        field(3; City; Text[30])
        {
            Caption = 'City';
        }
        field(4; "Phone No."; Text[30])
        {
            Caption = 'Phone No.';
            DataClassification = ToBeClassified;
        }
        field(5; "Synched"; Boolean)
        {
            Caption = 'Synched';
            DataClassification = ToBeClassified;
        }
        field(6; "Email"; Text[50])
        {
            Caption = 'Email';
            DataClassification = ToBeClassified;
        }
        field(7; "Entry No."; Integer)
        {
            Caption = 'Entry No.';
            DataClassification = ToBeClassified;
        }
        field(8; "Province"; Text[50])
        {
            DataClassification = ToBeClassified;
        }
        field(9; "PostCode"; Text[50])
        {
            DataClassification = ToBeClassified;
        }
    }
    keys
    {
        key(PK; "Entry No.")
        {
            Clustered = true;
        }
    }

    trigger OnInsert()
    var
        lrec: Record "NewCustomerInfo";
    begin
        lrec.Reset();
        if lrec.FindLast() then
            Rec."Entry No." := lrec."Entry No." + 1
        else
            Rec."Entry No." := 1;

    end;

}
