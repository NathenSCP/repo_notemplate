/// <summary>
/// Table Item Wish Line (ID 50411).
/// </summary>
table 50411 "Item Wish Line"
{
    Caption = 'Item Wish Line';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Entry No."; Integer)
        {
            Caption = 'Entry No.';
            DataClassification = ToBeClassified;
        }
        field(2; "Customer No."; Code[20])
        {
            Caption = 'Customer No.';
            DataClassification = ToBeClassified;
        }
        field(3; "Date"; Date)
        {
            Caption = 'Date';
            DataClassification = ToBeClassified;
        }
        field(4; Comment; Text[80])
        {
            Caption = 'Comment';
            DataClassification = ToBeClassified;
        }
        field(5; "Item No."; code[20])
        {
            TableRelation = Item."No.";
            DataClassification = ToBeClassified;
            Caption = 'Item No.';
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
        r: Record "Item Wish Line";
    begin
        r.Reset();
        if r.FindLast() then
            exit(r."Entry No." + 1)
        else
            exit(1);
    end;


}
