/// <summary>
/// Table COGS Exc Rate Adj Registers (ID 50410).
/// </summary>
table 50410 "COGS Exc Rate Adj Registers"
{
    Caption = 'COGS Exc Rate Adj Registers';
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
        r: record "COGS Exc Rate Adj Registers";
    begin
        if r.FindLast() then
            exit(r."Entry No." + 1)
        else
            exit(1);
    end;

}
