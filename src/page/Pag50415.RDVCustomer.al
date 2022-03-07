page 50415 "RDV Customer"
{

    Caption = 'RDV Customer';
    PageType = Card;
    SourceTable = "RDV Customers";
    DataCaptionExpression = '';
    ApplicationArea = All;
    UsageCategory = Administration;
    Editable = true;
    InsertAllowed = true;
    ModifyAllowed = true;


    layout
    {
        area(content)
        {

            group("Scan QR Code")
            {
                field("QR Code"; gQRCode)
                {
                    Caption = 'QR Code';
                    ApplicationArea = All;
                    QuickEntry = true;

                    trigger OnValidate()
                    var
                        r: Record "RDV Customers";
                    begin

                        if Ready then begin
                            //Message(gQRCode);
                            r.DeleteAll();
                            CurrPage.Test.Ping(gQRCode);
                        end
                        else
                            Message('Try again. after few seconds...');

                    end;
                }

                usercontrol(Test; MyDotNetTest)
                {
                    ApplicationArea = all;
                    trigger ControlReady()
                    begin
                        Ready := true;
                    end;

                    trigger Result(d: Integer)
                    begin
                        Message('The result is %1', d);
                    end;

                    trigger PingResult(t: Text)
                    var
                        arr: List of [Text];
                        addressarr: List of [Text];
                        r: Record "RDV Customers";
                    begin
                        // Message('Result');
                        // Message(Format(t));

                        arr := t.Split('###');
                        r.Init();
                        r."Entry No." := r.GetNextEntryNo();
                        if (arr.Get(1, gFN)) then begin
                            gFN := gFN.Replace('FN_NF_1', '');
                            gFN := gFN.Replace('FN_NF_2', '');
                            r."First Name" := gfn;
                        end;

                        if (arr.Get(2, gLN)) then begin
                            gLN := gLN.Replace('LN_NF_1', '');
                            r."Last Name" := gLN;
                        end;

                        r."Full Name" := gFN + ' ' + gLN;
                        r."Search Name 1" := gLN + ' ' + gFN;

                        if (arr.Get(3, gcellphone)) then begin
                            gcellphone := gcellphone.Replace('CELL_NF_1', '');
                            gcellphone := gcellphone.Replace('CELL_NF_2', '');
                            gcellphone := gcellphone.Replace('CELL_NF_3', '');
                            r."Phone No." := gcellphone;
                        end;

                        if (arr.Get(4, gemail)) then begin
                            gemail := gemail.Replace('Email_NF_1', '');
                            gemail := gemail.Replace('Email_NF_2', '');
                            gemail := gemail.Replace('Email_NF_3', '');
                            r."Email" := gemail;
                        end;


                        if (arr.Get(5, ghomeadd)) then begin
                            addressarr := ghomeadd.Split(',');
                            if addressarr.Get(1, ghomeadd) then begin
                                ghomeadd := ghomeadd.Replace('Add_NF_1', '');
                                ghomeadd := ghomeadd.Replace('Add_NF_2', '');
                                ghomeadd := ghomeadd.Replace('Add_NF_3', '');
                                r.Address := ghomeadd;
                            end;
                            if addressarr.Get(2, ghomecity) then begin
                                r.City := ghomecity;
                            end;
                            if addressarr.Get(3, gprov) then begin
                                r.Province := gprov;
                            end;
                            if addressarr.Get(4, gPostCode) then begin
                                r."Post Code" := gPostCode;
                            end;
                        end;

                        if (arr.Get(6, gfax)) then begin
                            gfax := gfax.Replace('Fax_NF_1', '');
                            gfax := gfax.Replace('Fax_NF_2', '');
                            gfax := gfax.Replace('Fax_NF_3', '');
                            r.Fax := gfax;
                        end;

                        if (arr.Get(7, gphone1)) then begin
                            gphone1 := gphone1.Replace('Phone_NF_1', '');
                            gphone1 := gphone1.Replace('Phone_NF_2', '');
                            gphone1 := gphone1.Replace('Phone_NF_3', '');
                            r."Phone 1" := gphone1;
                        end;


                        r.Insert();
                        gQRCode := '';
                        CurrPage.Update();

                        CurrPage.FoundCustomers.Page.updatePage();
                        CurrPage.FoundCustomers.Page.Update();

                    end;
                }
            }
            group(General)
            {
                field("First Name"; Rec."First Name")
                {
                    ToolTip = 'Specifies the value of the First Name field.';
                    ApplicationArea = All;
                }
                field("Last Name"; Rec."Last Name")
                {
                    ToolTip = 'Specifies the value of the Last Name field.';
                    ApplicationArea = All;
                }
                field("Full Name"; Rec."Full Name")
                {
                    ToolTip = 'Specifies the value of the Last Name field.';
                    ApplicationArea = All;
                }
            }

            group(Contact)
            {
                field("Cell"; Rec."Phone No.")
                {
                    ApplicationArea = All;
                    Caption = 'Mobile Phone No.';
                }
                field("Phone No."; Rec."Phone 1")
                {
                    ApplicationArea = All;
                    Caption = 'Phone No.';
                }
                field("Fax"; Rec.Fax)
                {
                    ApplicationArea = All;
                }
                field("Email"; Rec."Email")
                {
                    ApplicationArea = All;
                }
            }

            group(Address)
            {
                field(Address1; Rec.Address)
                {
                    ApplicationArea = All;
                    Caption = 'Address';
                }
                field(City; Rec.City)
                {
                    ApplicationArea = All;
                    Caption = 'City';
                }
                field(Province; Rec.Province)
                {
                    ApplicationArea = All;
                    Caption = 'Province';
                }
                field("Post Code"; Rec."Post Code")
                {
                    ApplicationArea = All;
                    Caption = 'Post Code';
                }
            }
            part("FoundCustomers"; "FoundCustomers")
            {
                ApplicationArea = All;
                SubPageLink = "Name" = Field("Full Name");
                //UpdatePropagation = Both;
                //SubPageView = sorting("No.") where("Name" = field("First Name"))
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(Scan)
            {
                ApplicationArea = All;
                Caption = 'Scan';
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;
                Image = Process;
                trigger OnAction()
                var
                    r: Record "RDV Customers";
                begin
                    gQRCode := '';
                    Rec."First Name" := '';
                    Rec."Last Name" := '';
                    Rec."Full Name" := '';
                    Rec."Phone 1" := '';
                    Rec.Fax := '';
                    Rec.Address := '';
                    Rec."Customer Url" := '';
                    Rec.Email := '';
                    Rec.City := '';
                    Rec.Province := '';
                    Rec."Post Code" := '';
                    Rec."Phone No." := '';
                    //Commit();
                    CurrPage.Update(true);
                    //CurrPage.FoundCustomers.Page.Update();
                end;
            }


            action(TestAction1)
            {
                Caption = 'QR Code Scan';
                InFooterBar = true;
                ApplicationArea = All;
                Visible = false;
                trigger OnAction()
                begin
                    if Ready then
                        CurrPage.Test.Ping('abc')
                    else
                        Message('Try again. after few seconds...');
                end;
            }

            action(ActionName)
            {
                ApplicationArea = All;
                Caption = 'QR Code', comment = 'NLB="YourLanguageCaption"';
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;
                Image = Process;
                Visible = false;
                trigger OnAction()
                var
                    p: Page "QR Scan Dialog";
                    lAction: Action;
                    data: Text;
                begin
                    if Dialog.Confirm('Are you sure you want to post exchange adjustment?') then begin

                        lAction := p.RunModal();
                        case lAction of
                            action::OK, action::LookupOK:
                                begin
                                    data := p.GetQR();
                                end;
                        end;
                    end;
                end;
            }
        }

    }

    procedure AddNewCustomer()
    begin

    end;

    trigger OnOpenPage()
    var
        r: Record "RDV Customers";
    begin
        gQRCode := '';
        r.DeleteAll();
    end;

    var
        Ready: Boolean;
        gQRCode: Text[2048];

        gFN: Text[200];
        gLN: Text[200];

        gcellphone: Text[100];

        gemail: Text[100];
        ghomephone: Text[100];

        gworkPhone: Text[100];

        ghomeadd: text[200];

        ghomecity: Text[100];

        gprov: Text[100];

        gPostCode: Text[100];
        gUrl: Text[200];

        gfax: Text[200];

        gphone1: Text[200];

}
