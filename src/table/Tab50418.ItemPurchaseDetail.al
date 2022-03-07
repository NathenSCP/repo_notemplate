table 50418 "Item Purchase Detail"
{
    Caption = 'Item Purchase Detail';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Entry No."; Integer)
        {
            Caption = 'Entry No.';
            DataClassification = ToBeClassified;
        }
        field(2; "Item No."; Code[20])
        {
            Caption = 'Item No.';
            DataClassification = ToBeClassified;
        }
        field(3; "Price Discount Code"; Code[20])
        {
            Caption = 'Price Discount Code';
            DataClassification = ToBeClassified;
        }
        field(4; "Serial No."; Code[20])
        {
            Caption = 'Serial No.';
            DataClassification = ToBeClassified;
        }
        field(5; "Item Description"; Text[200])
        {
            Caption = 'Item Description';
            DataClassification = ToBeClassified;
        }
        field(6; "Cost Amount"; Decimal)
        {
            Caption = 'Cost Amount';
            DataClassification = ToBeClassified;
        }
        field(7; "Item Price"; Decimal)
        {
            Caption = 'Item Price';
            DataClassification = ToBeClassified;
        }
        field(8; "Item Cat"; Code[20])
        {
            DataClassification = ToBeClassified;
        }
        field(9; "Document No."; Code[20])
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

    procedure GetNextEntryNo(): Integer
    var
        r: Record "Item Purchase Detail";
    begin
        r.Reset();
        if r.FindLast() then
            exit(r."Entry No." + 1)
        else
            exit(1);
    end;
}
