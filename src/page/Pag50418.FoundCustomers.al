page 50418 FoundCustomers
{

    Caption = 'FoundCustomers';
    PageType = ListPart;
    SourceTable = Customer;
    Editable = false;
    RefreshOnActivate = true;

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field("No."; Rec."No.")
                {
                    ToolTip = 'Specifies the value of the No. field.';
                    ApplicationArea = All;
                }
                field(Name; Rec.Name)
                {
                    ToolTip = 'Specifies the value of the Name field.';
                    ApplicationArea = All;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(Update)
            {
                ApplicationArea = All;
                Caption = 'Update Customer Info';
                Promoted = true;
                PromotedCategory = New;
                //PromotedIsBig = true;
                Image = Process;
                Visible = true;
                trigger OnAction()
                var
                    lAction: Action;
                    SalesSetup: Record "Sales & Receivables Setup";
                    NoSrsMgmt: Codeunit NoSeriesManagement;
                begin

                    if newCustomer.FindFirst() then begin

                        if Rec.Name <> '' then begin
                            if Dialog.Confirm('Are you sure you want to update customer information?') then begin
                                Rec.Validate("Phone No.", newCustomer."Phone 1");
                                Rec.Validate("Fax No.", newCustomer.Fax);
                                Rec.Validate(Address, newCustomer.Address);
                                Rec.Validate("Mobile Phone No.", newCustomer."Phone No.");
                                Rec.Validate(City, newCustomer.city);
                                Rec.Validate("E-Mail", newCustomer.Email);
                                Rec.Validate("Post Code", newCustomer."Post Code");
                                Rec.Validate(County, newCustomer.Province);
                                Rec.Validate(Name, newCustomer."Full Name");
                                Rec.Modify();

                                newCustomer.DeleteAll();
                                Commit();
                                //Message('Customer information has been updated');
                                Page.RunModal(Page::"Customer Card", Rec);
                                CurrPage.Update();
                            end;
                        end
                        else begin
                            if newCustomer.FindFirst() then begin
                                if Dialog.Confirm('Are you sure you want to insert new customer?') then begin
                                    SalesSetup.Get();
                                    Rec.Init();
                                    Rec.Validate("No.", NoSrsMgmt.GetNextNo(SalesSetup."Customer Nos.", Today(), true));
                                    Rec.Validate("Phone No.", newCustomer."Phone 1");
                                    Rec.Validate("Fax No.", newCustomer.Fax);
                                    Rec.Validate("E-Mail", newCustomer.Email);
                                    Rec.Validate(Address, newCustomer.Address);
                                    Rec.Validate("Mobile Phone No.", newCustomer."Phone No.");
                                    Rec.Validate(City, newCustomer.city);
                                    Rec.Validate("Post Code", newCustomer."Post Code");
                                    Rec.Validate(County, newCustomer.Province);
                                    Rec.Validate(Name, newCustomer."Full Name");
                                    Rec.Insert();
                                    newCustomer.DeleteAll();
                                    Commit();
                                    Page.RunModal(Page::"Customer Card", Rec);
                                    //Message('New Customer inserted.');
                                    CurrPage.Update();
                                end;
                            end;
                        end;
                    end;
                end;
            }

            action(Insert)
            {
                ApplicationArea = All;
                Caption = 'Insert New Customer';
                Promoted = true;
                PromotedCategory = New;
                //PromotedIsBig = true;
                Image = Process;
                Visible = false;
                trigger OnAction()
                var
                    lAction: Action;
                    SalesSetup: Record "Sales & Receivables Setup";
                    NoSrsMgmt: Codeunit NoSeriesManagement;
                begin
                    if binsert = false then
                        error('Insert not allowed!');

                    if newCustomer.FindFirst() then begin
                        if Dialog.Confirm('Are you sure you want to insert new customer?') then begin
                            SalesSetup.Get();
                            Rec.Init();
                            Rec.Validate("No.", NoSrsMgmt.GetNextNo(SalesSetup."Customer Nos.", Today(), true));
                            Rec.Validate("Phone No.", newCustomer."Phone 1");
                            Rec.Validate("Fax No.", newCustomer.Fax);
                            Rec.Validate(Address, newCustomer.Address);
                            Rec.Validate("Mobile Phone No.", newCustomer."Phone No.");
                            Rec.Validate(City, newCustomer.city);
                            Rec.Validate("Post Code", newCustomer."Post Code");
                            Rec.Validate(County, newCustomer.Province);
                            Rec.Validate(Name, newCustomer."Full Name");
                            Rec.Insert();
                            newCustomer.DeleteAll();
                            Commit();
                            Page.RunModal(Page::"Customer Card", Rec);
                            Message('New Customer inserted.');
                            CurrPage.Update();
                        end;
                    end;
                end;
            }
        }
    }

    // trigger OnAfterGetCurrRecord()
    // var
    //     newCustomer: record "RDV Customers";
    // begin
    //     newCustomer.Reset();
    //     bUpdate := false;
    //     binsert := false;
    //     if newCustomer.FindFirst() then begin
    //         Rec.SetFilter(Name, '%1|%2|%3|%4', newCustomer."First Name", newCustomer."Last Name", newCustomer."Full Name", newCustomer."Search Name 1");

    //         If Rec.FindSet() then begin
    //             bUpdate := true;
    //             binsert := false;
    //         end
    //         else begin
    //             bUpdate := false;
    //             binsert := true;
    //         end;
    //     end;
    // end;

    trigger OnOpenPage()
    var
        newCustomer: record "RDV Customers";
    begin
        newCustomer.Reset();
        bUpdate := false;
        binsert := false;
        if newCustomer.FindFirst() then begin
            Rec.SetFilter(Name, '%1|%2|%3|%4', newCustomer."First Name", newCustomer."Last Name", newCustomer."Full Name", newCustomer."Search Name 1");

            If Rec.FindSet() then begin
                bUpdate := true;
                binsert := false;
            end
            else begin
                bUpdate := false;
                binsert := true;
            end;
        end;
    end;

    procedure updatePage()
    var
        newCustomer: record "RDV Customers";
    begin
        newCustomer.Reset();
        bUpdate := false;
        binsert := false;
        if newCustomer.FindFirst() then begin
            Rec.SetFilter(Name, '%1|%2|%3|%4', newCustomer."First Name", newCustomer."Last Name", newCustomer."Full Name", newCustomer."Search Name 1");

            If Rec.FindSet() then begin
                bUpdate := true;
                binsert := false;
            end
            else begin
                bUpdate := false;
                binsert := true;
            end;
        end;

        CurrPage.Update();
    end;

    var
        newCustomer: Record "RDV Customers";

        [InDataSet]
        bUpdate: Boolean;

        [InDataSet]
        binsert: Boolean;

}
