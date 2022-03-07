table 50415 "RDV Inv All Detail Led Entry"
{
    Caption = 'RDV Inv All Detail Led Entry';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Entry No."; Integer)
        {
            Caption = 'Entry No.';
            DataClassification = ToBeClassified;
        }
        field(2; "Entry Type"; Option)
        {
            Caption = 'Entry Type';
            DataClassification = ToBeClassified;
            OptionMembers = "Initial Entry","Adjust","Closing Entry";
        }
        field(3; "Item Led Entry No."; Integer)
        {
            Caption = 'Item Led Entry No.';
            DataClassification = ToBeClassified;
        }
        field(4; "Posting Date"; Date)
        {
            Caption = 'Posting Date';
            DataClassification = ToBeClassified;
        }
        field(5; "Allowance Amt"; Decimal)
        {
            Caption = 'Allowance Amt';
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
        r: Record "RDV Inv All Detail Led Entry";
    begin
        r.Reset();
        if (r.FindLast()) then begin
            exit(r."Entry No." + 1);
        end
        else
            exit(1);

    end;

}
