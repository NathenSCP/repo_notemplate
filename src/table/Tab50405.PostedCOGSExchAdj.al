table 50405 "Posted COGS Exch Adj"
{
    Caption = 'Posted COGS Exch Adj';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Entry No."; Integer)
        {
            Caption = 'Entry No.';
            DataClassification = ToBeClassified;
        }
        field(2; "Posting Date"; Date)
        {
            Caption = 'Posting Date';
            DataClassification = ToBeClassified;
        }
        field(3; "Doc No."; Code[20])
        {
            Caption = 'Doc No.';
            DataClassification = ToBeClassified;
        }
        field(4; "ILE Entry No."; Integer)
        {
            Caption = 'ILE Entry No.';
            DataClassification = ToBeClassified;
        }
        field(5; "ILE Posting Date"; Date)
        {
            Caption = 'ILE Posting Date';
            DataClassification = ToBeClassified;
        }
        field(6; "Item No."; Code[20])
        {
            Caption = 'Item No.';
            DataClassification = ToBeClassified;
        }
        field(7; "Item Desc"; Text[250])
        {
            Caption = 'Item Desc';
            DataClassification = ToBeClassified;
        }
        field(8; Location; Code[10])
        {
            Caption = 'Location';
            DataClassification = ToBeClassified;
        }
        field(9; Quantity; Decimal)
        {
            Caption = 'Quantity';
            DataClassification = ToBeClassified;
        }
        field(10; "Serial No."; Code[20])
        {
            Caption = 'Serial No.';
            DataClassification = ToBeClassified;
        }
        field(11; "Purch Inv Unit Price"; Decimal)
        {
            Caption = 'Purch Inv Unit Price';
            DataClassification = ToBeClassified;
        }
        field(12; "Purch Inv Total Price"; Decimal)
        {
            Caption = 'Purch Inv Total Price';
            DataClassification = ToBeClassified;
        }
        field(13; "Purch Inv Exch Rate"; Decimal)
        {
            Caption = 'Purch Inv Exch Rate';
            DataClassification = ToBeClassified;
        }
        field(14; "Spot Exch Rate"; Decimal)
        {
            Caption = 'Spot Exch Rate';
            DataClassification = ToBeClassified;
        }
        field(15; "Exch Adj"; Decimal)
        {
            Caption = 'Exch Adj';
            DataClassification = ToBeClassified;
        }
        field(16; "Document No."; code[20])
        {
            DataClassification = ToBeClassified;
        }
        field(17; "ILE Doc No."; code[20])
        {
            DataClassification = ToBeClassified;
        }

        field(18; "Purchase Invoice Unit Price"; Decimal)
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
        lastrecord: Record "Posted COGS Exch Adj";
    begin
        lastrecord.Reset();
        if lastrecord.FindLast() then
            exit(lastrecord."Entry No." + 1)
        else
            exit(1);
    end;

}
