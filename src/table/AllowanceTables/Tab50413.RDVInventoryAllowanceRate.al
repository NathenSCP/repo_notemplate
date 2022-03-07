table 50413 "RDV Inventory Allowance Rate"
{
    Caption = 'RDV Inventory Allowance Rate';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Entry No."; Integer)
        {
            Caption = 'Entry No.';
            DataClassification = ToBeClassified;
        }
        field(2; Year; Integer)
        {
            Caption = 'Year';
            DataClassification = ToBeClassified;
        }
        field(3; Percentage; Decimal)
        {
            Caption = 'Percentage';
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
        r: Record "RDV Inventory Allowance Rate";
    begin
        r.Reset();
        if r.FindLast() then
            exit(r."Entry No." + 1)
        else
            exit(1);
    end;

    trigger OnInsert()
    begin
        Rec."Entry No." := GetNextEntryNo();
    end;

}
