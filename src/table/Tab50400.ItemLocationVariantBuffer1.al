
table 50400 "Item Location Variant Buffer 1"
{
    Caption = 'Item Location Variant Buffer';

    fields
    {
        field(1; "Item No."; Code[20])
        {
            Caption = 'Item No.';
            DataClassification = ToBeClassified;
        }
        field(2; "Variant Code"; Code[10])
        {
            Caption = 'Variant Code';
            DataClassification = ToBeClassified;
        }
        field(3; "Location Code"; Code[10])
        {
            Caption = 'Location Code';
            DataClassification = ToBeClassified;
        }
        field(4; Label; Text[250])
        {
            Caption = 'Label';
            DataClassification = ToBeClassified;
        }
        field(5; "Remaining Quantity"; Decimal)
        {
            Caption = 'Remaining Quantity';
            DataClassification = ToBeClassified;
        }
        field(6; Value1; Decimal)
        {
            Caption = 'Value1';
            DataClassification = ToBeClassified;
            Description = 'Local Cost Amount';
        }
        field(7; Value2; Decimal)
        {
            //Caption = 'Line Cost Amount';
            DataClassification = ToBeClassified;
        }
        field(8; Value3; Decimal)
        {
            Caption = 'Value3';
            DataClassification = ToBeClassified;
        }
        field(9; Value4; Decimal)
        {
            Caption = 'Value4';
            DataClassification = ToBeClassified;
        }
        field(10; Value5; Decimal)
        {
            Caption = 'Value5';
            DataClassification = ToBeClassified;
        }
        field(11; Value6; Decimal)
        {
            Caption = 'Value6';
            DataClassification = ToBeClassified;
        }
        field(12; Value7; Decimal)
        {
            Caption = 'ForeignCostAmount';
            DataClassification = ToBeClassified;
            Description = 'ForeignCostAmount';
        }
        field(13; Value8; Decimal)
        {
            Caption = 'NewCADCostAmount';
            DataClassification = ToBeClassified;
            Description = 'NewCADCostAmount';
        }
        field(14; Value9; Decimal)
        {
            Caption = 'diffQOH';
            DataClassification = ToBeClassified;
            Description = 'diff qoh';
        }
        field(15; Value10; Decimal)
        {
            Caption = 'diff';
            DataClassification = ToBeClassified;
            Description = 'diff';
        }
        field(16; Value11; Decimal)
        {
            Caption = 'ILE Qty';
            DataClassification = ToBeClassified;
            Description = 'ILE Qty';
        }
        field(17; "Entry No."; Integer)
        {
            Caption = 'ILE Entry No.';
            DataClassification = ToBeClassified;
            Description = 'ILE Entry No.';
        }
        field(18; "Value Entry No."; Integer)
        {
            DataClassification = ToBeClassified;
        }
        field(19; "Purchase Invoice No."; Code[10])
        {
            DataClassification = ToBeClassified;
        }
        field(20; "Purhcase Invoice Currency Fact"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(21; "Currency Exch Rate As of Date"; Decimal)
        {
            DataClassification = ToBeClassified;
        }
        field(22; "Purchase Invoice Curr Code"; Code[10])
        {
            DataClassification = ToBeClassified;
        }
        field(23; "ILE Posting Date"; Date)
        {
            DataClassification = ToBeClassified;
        }
        field(24; "Currency Exh Rate Date"; Date)
        {
            DataClassification = ToBeClassified;
        }
    }

    keys
    {
        key(Key1; "Entry No.")
        {
            Clustered = true;
        }
    }

    fieldgroups
    {
    }
}

