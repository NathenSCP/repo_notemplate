table 50401 "SCP Gci Tracking"
{
    Caption = 'SCP Gci Tracking';
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
        field(3; "Tracking Spec Entry No."; Integer)
        {
            Caption = 'Tracking Specification Entry No.';
            DataClassification = ToBeClassified;
        }
        field(4; "Item Ledger Entry No."; Integer)
        {
            Caption = 'Item Ledger Entry No.';
            DataClassification = ToBeClassified;
        }
        field(5; "Serial No."; Code[50])
        {
            Caption = 'Serial No.';
            DataClassification = ToBeClassified;
        }
        field(6; "GIA No."; Code[50])
        {
            Caption = 'GIA/Serial No.';
            DataClassification = ToBeClassified;
        }
        field(7; "Purch. Entry Type"; Enum "Item Ledger Entry Type")
        {
            Caption = 'Purch. Entry Type';
        }
        field(8; "Purch. Doc No."; Code[20])
        {
            Caption = 'Purch. Document No.';
        }
        field(9; "Purch. Doc Type"; Enum "Item Ledger Document Type")
        {
            Caption = 'Purch. Document Type';
        }
        field(10; "Sale Entry Type"; Enum "Item Ledger Entry Type")
        {
            Caption = 'Sale Entry Type';
        }
        field(11; "Sale Doc No."; Code[20])
        {
            Caption = 'Sale Document No.';
        }
        field(12; "Sale Doc Type"; Enum "Item Ledger Document Type")
        {
            Caption = 'Sale Document Type';
        }
    }
    keys
    {
        key(PK; "Entry No.")
        {
            Clustered = true;
        }
        key(UniqueKey; "Serial No.", "GIA No.")
        {

        }
    }

    procedure GetEntryNo(): Integer
    var
        lRec: Record "SCP Gci Tracking";
    begin
        lRec.Reset();
        if lRec.FindLast() then begin
            exit((lRec."Entry No."));
        end
        else begin
            exit(0);
        end;

    end;

}
