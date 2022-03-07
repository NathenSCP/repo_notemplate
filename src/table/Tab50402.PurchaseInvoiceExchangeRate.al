table 50402 "Purchase Invoice Exchange Rate"
{
    Caption = 'Purchase Invoice Exchange Rate';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Value Entry No."; Integer)
        {
            Caption = 'Value Entry No.';
            DataClassification = ToBeClassified;
        }
        field(2; "Item Ledger Entry No."; Integer)
        {
            Caption = 'Item Ledger Entry No.';
            DataClassification = ToBeClassified;
        }
        field(3; "Item No."; Code[20])
        {
            Caption = 'Item No.';
            DataClassification = ToBeClassified;
        }
        field(4; "Invoiced Quantity"; Decimal)
        {
            Caption = 'Quantity';
            DataClassification = ToBeClassified;
        }
        field(5; "Serial No."; Code[20])
        {
            Caption = 'Serial No.';
            DataClassification = ToBeClassified;
        }
        field(6; "System Exchange Rate"; Decimal)
        {
            Caption = 'System Exchange Rate';
            DataClassification = ToBeClassified;
            DecimalPlaces = 2 : 6;
        }
        field(7; "Spot Exchange Rate"; Decimal)
        {
            Caption = 'Spot Exchange Rate';
            DataClassification = ToBeClassified;
            DecimalPlaces = 2 : 6;
        }
        field(8; "Currency Exch Rate Start Date"; Date)
        {
            Caption = 'Currency Exch Rate Start Date';
            DataClassification = ToBeClassified;
        }
        field(9; "Currency Code"; code[20])
        {
            Caption = 'Currency Code';
            DataClassification = ToBeClassified;
        }
        field(10; "Currency Factor"; Decimal)
        {
            Caption = 'Currency Factor';
            DataClassification = ToBeClassified;
            DecimalPlaces = 2 : 6;
        }
        field(11; "Cost Per Unit Foreign"; Decimal)
        {
            Caption = 'Cost Foreign Value';
            DataClassification = ToBeClassified;
        }
        field(12; "Cost Per Unit Local"; Decimal)
        {
            Caption = 'Cost Local Value';
            DataClassification = ToBeClassified;
        }
        field(13; "Entry Type"; Enum "Item Ledger Entry Type")
        {
            Caption = 'Entry Type';
        }
        field(14; "Document No."; code[20])
        {
            Caption = 'Document No.';
        }
        field(15; "Item Description"; Text[250])
        {
            Caption = 'Item Description';
        }
        field(16; "Cost Amount(Actual)"; Decimal)
        {
            DecimalPlaces = 2 : 6;
        }
        field(17; "Entry No."; Integer)
        {

        }
        field(18; "Purchase Posted"; Boolean)
        {

        }
        field(19; "Sales Posted"; Boolean)
        {

        }
        field(20; "Purchase Invoice Document No."; code[20])
        {

        }

        field(21; "Location Code"; Code[20])
        {

        }

        field(22; "Sales Posted Image"; Blob)
        {
            Subtype = Bitmap;
            DataClassification = SystemMetadata;
        }
    }
    keys
    {
        key(PK; "Entry No.")
        {
            Clustered = true;
        }
    }

    procedure FindNextEntryNo(): Integer
    var
        lSelf: record "Purchase Invoice Exchange Rate";
    begin
        lSelf.Reset();
        if lSelf.FindLast() then
            exit(lSelf."Entry No." + 1)
        else
            exit(1);

    end;


}
