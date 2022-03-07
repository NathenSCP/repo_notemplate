pageextension 50412 "RDV Job List" extends "Job List"
{
    layout

    {
        addafter("Bill-to Customer No.")
        {
            field(CustomerName; gCustomerName)
            {
                ApplicationArea = All;
                Caption = 'Customer Name';
            }

        }
    }

    trigger OnAfterGetRecord()
    var
        c: Record Customer;
    begin
        c.Reset();
        c.SetLoadFields(Name);
        c.Get(Rec."Bill-to Customer No.");
        gCustomerName := c.Name;
    end;

    var
        gCustomerName: Text[100];
}
