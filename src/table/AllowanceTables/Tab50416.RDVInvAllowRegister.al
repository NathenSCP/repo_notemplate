table 50416 "RDV Inv Allow Register"
{
    Caption = 'RDV Inv Allow Register';
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
        field(4; "Allow Amount"; Decimal)
        {
            Caption = 'Allow Amount';
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
        r: Record "RDV Inv Allow Register";
    begin
        r.Reset();
        if (r.FindLast()) then begin
            exit(r."Entry No." + 1);
        end
        else
            exit(1);

    end;

}
