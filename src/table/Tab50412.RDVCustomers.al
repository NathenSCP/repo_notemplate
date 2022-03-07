table 50412 "RDV Customers"
{
    Caption = 'RDV Customer';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "Entry No."; Integer)
        {
            Caption = 'Entry No.';
            DataClassification = ToBeClassified;
        }
        field(2; "First Name"; Text[50])
        {
            Caption = 'First Name';
            DataClassification = ToBeClassified;
            trigger OnValidate()
            begin
                "Full Name" := "First Name" + ' ' + "Last Name";
                "Search Name 1" := "Last Name" + ' ' + "First Name";
            end;
        }
        field(3; "Last Name"; Text[50])
        {
            Caption = 'Last Name';
            DataClassification = ToBeClassified;

            trigger OnValidate()
            begin
                "Full Name" := "First Name" + ' ' + "Last Name";
                "Search Name 1" := "Last Name" + ' ' + "First Name";
            end;
        }
        field(4; "Phone No."; Text[50])
        {
            Caption = 'Phone No.';
            DataClassification = ToBeClassified;
        }
        field(5; "Customer Url"; Text[200])
        {
            Caption = 'Customer Url';
            DataClassification = ToBeClassified;
        }

        field(6; "Address"; Text[250])
        {
            Caption = 'Address';
            DataClassification = ToBeClassified;
        }
        field(7; "City"; Text[50])
        {
            Caption = 'City';
            DataClassification = ToBeClassified;
        }
        field(8; "Province"; Text[50])
        {
            Caption = 'Province';
            DataClassification = ToBeClassified;
        }
        field(9; "Post Code"; Text[50])
        {
            Caption = 'Post Code';
            DataClassification = ToBeClassified;
        }
        field(10; "Full Name"; Text[300])
        {
            DataClassification = ToBeClassified;
        }
        field(11; "Email"; Text[300])
        {
            DataClassification = ToBeClassified;
        }
        field(12; "Search Name 1"; Text[300])
        {
            DataClassification = ToBeClassified;
        }
        field(13; "Fax"; Text[300])
        {
            DataClassification = ToBeClassified;
        }
        field(14; "Phone 1"; Text[300])
        {
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
        r: Record "RDV Customers";
    begin
        r.Reset();
        if r.FindLast() then
            exit(r."Entry No." + 1)
        else
            exit(1);
    end;
}
