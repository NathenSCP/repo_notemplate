table 50404 "Posted Inv Exch Adj"
{
    Caption = 'Posted Inv Exch Adj';
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
        field(3; "ILE Posting Date"; Date)
        {
            Caption = 'ILE Posting Date';
            DataClassification = ToBeClassified;
        }
        field(4; "ILE Doc No."; Code[20])
        {
            Caption = 'ILE Doc No.';
            DataClassification = ToBeClassified;
        }
        field(5; "Item No."; Code[20])
        {
            Caption = 'Item No.';
            DataClassification = ToBeClassified;
        }
        field(6; Description; Text[500])
        {
            Caption = 'Description';
            DataClassification = ToBeClassified;
        }
        field(7; "Serial No."; Code[20])
        {
            Caption = 'Serial No.';
            DataClassification = ToBeClassified;
        }
        field(8; Quantity; Decimal)
        {
            Caption = 'Quantity';
            DataClassification = ToBeClassified;
        }
        field(9; "Remaining Qty."; Decimal)
        {
            Caption = 'Remaining Qty.';
            DataClassification = ToBeClassified;
        }
        field(10; "Purch Inv Unit Price"; Decimal)
        {
            Caption = 'Purch Inv Unit Price';
            DataClassification = ToBeClassified;
            DecimalPlaces = 1 : 2;
        }
        field(11; "Purch Inv Total Price"; Decimal)
        {
            Caption = 'Purch Inv Total Price';
            DataClassification = ToBeClassified;
            DecimalPlaces = 1 : 2;
        }
        field(12; "Purch Inv Exch Rate"; Decimal)
        {
            Caption = 'Purch Inv Exch Rate';
            DataClassification = ToBeClassified;
            DecimalPlaces = 2 : 6;
        }
        field(13; "Spot Exch Rate"; Decimal)
        {
            Caption = 'Spot Exch Rate';
            DataClassification = ToBeClassified;
            DecimalPlaces = 2 : 6;
        }
        field(14; "Exch Adj"; Decimal)
        {
            Caption = 'Exch Adj';
            DataClassification = ToBeClassified;
            DecimalPlaces = 2 : 6;
        }
        field(15; "Document No."; code[20])
        {
            DataClassification = ToBeClassified;
        }
        field(16; "ILE Entry No."; Integer)
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

    /// <summary>
    /// GetNextEntryNo.
    /// </summary>
    /// <returns>Return value of type Integer.</returns>
    procedure GetNextEntryNo(): Integer
    var
        lastrecord: Record "Posted Inv Exch Adj";
    begin
        lastrecord.Reset();
        if lastrecord.FindLast() then
            exit(lastrecord."Entry No." + 1)
        else
            exit(1);
    end;

}
