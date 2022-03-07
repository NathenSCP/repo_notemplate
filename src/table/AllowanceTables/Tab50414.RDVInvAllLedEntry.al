table 50414 "RDV Inv All Led Entry"
{
    Caption = 'RDV Inv All Led Entry';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Item Ledger Entry No."; Integer)
        {
            Caption = 'Entry No.';
            DataClassification = ToBeClassified;
        }
        field(2; "Posting Date"; Date)
        {
            Caption = 'Posting Date';
            DataClassification = ToBeClassified;
        }
        field(3; "Document No."; Code[20])
        {
            Caption = 'Document No.';
            DataClassification = ToBeClassified;
        }
        field(4; "Item No."; Code[20])
        {
            Caption = 'Item No.';
            DataClassification = ToBeClassified;
        }
        field(5; Description; Text[250])
        {
            Caption = 'Description';
            DataClassification = ToBeClassified;
        }
        field(6; "Serial No."; Code[20])
        {
            Caption = 'Serial No.';
            DataClassification = ToBeClassified;
        }
        field(7; Location; Code[10])
        {
            Caption = 'Location';
            DataClassification = ToBeClassified;
        }
        field(8; Quantity; Decimal)
        {
            Caption = 'Quantity';
            DataClassification = ToBeClassified;
        }
        field(9; "Allowance Amount"; Decimal)
        {
            Caption = 'Allowance Amount';
            FieldClass = FlowField;
            Editable = false;
            CalcFormula = Sum("RDV Inv All Detail Led Entry"."Allowance Amt" where("Item Led Entry No." = Field("Item Ledger Entry No.")));
        }
        field(10; Open; Boolean)
        {
            Caption = 'Open';
            DataClassification = ToBeClassified;
        }
        field(11; "Closing Date"; Date)
        {
            Caption = 'Closing Date';
            DataClassification = ToBeClassified;
        }
        field(12; "Entry No."; Integer)
        {
            Caption = 'Entry No.';
            DataClassification = SystemMetadata;
        }
        field(13; "Remaining Qty."; Integer)
        {
            Caption = 'Remaining Qty.';
            DataClassification = SystemMetadata;
        }
    }
    keys
    {
        key(PK; "Entry No.")
        {
            Clustered = true;
        }
        key(Key1; "Item Ledger Entry No.")
        {
            Clustered = false;
        }
    }

    procedure GetNextEntryNo(): Integer
    var
        r: Record "RDV Inv All Led Entry";
    begin
        r.Reset();
        if (r.FindLast()) then begin
            exit(r."Entry No." + 1);
        end
        else
            exit(1);

    end;
}
