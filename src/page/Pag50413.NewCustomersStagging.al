/// <summary>
/// Page New Customers Stagging (ID 50413).
/// </summary>
page 50413 "New Customers Stagging"
{

    ApplicationArea = All;
    Caption = 'New Customers Stagging';
    PageType = List;
    SourceTable = NewCustomerInfo;
    UsageCategory = Administration;

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("Customer Name"; Rec."Customer Name")
                {
                    ToolTip = 'Specifies the value of the Customer Name field.';
                    ApplicationArea = All;
                }
                field(Address; Rec.Address)
                {
                    ToolTip = 'Specifies the value of the Address field.';
                    ApplicationArea = All;
                }
                field("Phone No."; Rec."Phone No.")
                {
                    ToolTip = 'Specifies the value of the Phone No. field.';
                    ApplicationArea = All;
                }
                field(Email; Rec.Email)
                {
                    ApplicationArea = All;
                }
                field(City; Rec.City)
                {
                    ApplicationArea = All;
                }
                field(Province; Rec.Province)
                {
                    ApplicationArea = All;
                }
                field(PostCode; Rec.PostCode)
                {
                    ApplicationArea = All;
                }
                field(Synched; Rec.Synched)
                {
                    ApplicationArea = All;
                    Editable = false;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(NewCustomer)
            {
                ApplicationArea = All;
                Caption = 'Confirm Customer';
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;
                Image = New;
                trigger OnAction()
                var
                    cust: record Customer;
                    newcust: Record Customer;
                    SalesSetup: Record "Sales & Receivables Setup";
                    NoSrsMgmt: Codeunit NoSeriesManagement;
                begin
                    if Rec.Synched then
                        Error('Information already synched!');

                    cust.Reset();
                    cust.SetRange(Name, Rec."Customer Name");
                    if (cust.FindFirst()) then begin
                        if Dialog.Confirm('Are you sure you want to update details of customer %1 ?', true, cust.Name) then begin
                            cust.Validate("Phone No.", Rec."Phone No.");
                            //cust.Validate("E-Mail",Rec.);
                            cust.Validate(Address, Rec.Address);
                            cust.Validate(City, Rec.City);
                            cust.Validate("Post Code", Rec.PostCode);
                            cust.Validate(County, Rec.Province);
                            cust.Modify();

                            Rec.Synched := true;
                            Rec.Modify();

                            if Dialog.Confirm('Customer information updated for %1, Woud you like check customer details?', true, cust.Name) then begin
                                Page.Run(21, cust);
                            end

                        end;
                    end
                    else// new customer
                    begin
                        if Dialog.Confirm('Are you sure you want to create new customer %1 ?', true, cust.Name) then begin
                            SalesSetup.Get();
                            newcust.Init();
                            newcust.Validate("No.", NoSrsMgmt.GetNextNo(SalesSetup."Customer Nos.", Today(), true));
                            newcust.Validate(Name, Rec."Customer Name");
                            newcust.Validate("Phone No.", Rec."Phone No.");
                            newcust.Validate("E-Mail", Rec.Email);
                            newcust.Validate(Address, Rec.Address);
                            newcust.Validate(City, Rec.City);
                            newcust.Validate("Post Code", Rec.PostCode);
                            newcust.Validate(County, Rec.Province);
                            newcust.Insert();

                            Rec.Synched := true;
                            Rec.Modify();
                            if Dialog.Confirm('New Customer %1 registered, Woud you like check customer details?', true, newcust.Name) then begin
                                Page.Run(21, newcust);
                            end

                        end;
                    end;
                end;
            }
        }

    }

}
