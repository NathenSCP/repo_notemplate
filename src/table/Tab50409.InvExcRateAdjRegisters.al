/// <summary>
/// Table Inv Exc Rate Adj Registers (ID 50409).
/// </summary>
table 50409 "Inv Exc Rate Adj Registers"
{
    Caption = 'Inv Exc Rate Adj Registers';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Entry No."; Integer)
        {
            Caption = 'Entry No.';
            DataClassification = ToBeClassified;
        }
        field(2; "Creation Date"; Date)
        {
            Caption = 'Creation Date';
            DataClassification = ToBeClassified;
        }
        field(3; "Document No."; Code[20])
        {
            Caption = 'Document No.';
            DataClassification = ToBeClassified;
        }
        field(4; Amount; Decimal)
        {
            Caption = 'Amount';
            DataClassification = ToBeClassified;
            DecimalPlaces = 2 : 2;
        }
        field(5; Reverse; Boolean)
        {
            Caption = 'Reverse';
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
    /// FindNextEntryNo.
    /// </summary>
    /// <returns>Return value of type Integer.</returns>
    procedure FindNextEntryNo(): Integer
    var
        r: record "Inv Exc Rate Adj Registers";
    begin
        if r.FindLast() then
            exit(r."Entry No." + 1)
        else
            exit(1);
    end;



}
