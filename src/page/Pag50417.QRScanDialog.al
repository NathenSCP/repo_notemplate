page 50417 "QR Scan Dialog"
{

    Caption = 'Enter';
    PageType = StandardDialog;

    layout
    {
        area(content)
        {
            group(General)
            {
                field("QR Code"; gQRCode)
                {
                    ApplicationArea = All;
                    Caption = 'Posting Date';
                    Editable = true;
                    trigger OnValidate()
                    begin

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
                    begin
                        Message(t);
                    end;
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action(TestAction1)
            {
                Caption = 'Ping';
                InFooterBar = true;
                ApplicationArea = All;
                trigger OnAction()
                begin
                    if Ready then
                        CurrPage.Test.Ping(gQRCode)
                    else
                        Message('Dotnet still loading....');
                end;
            }
            action(TestAction2)
            {
                Caption = 'Calc 2 + 3';
                InFooterBar = true;
                ApplicationArea = All;
                trigger OnAction()
                begin
                    if Ready then
                        CurrPage.Test.Calc(2, 3)
                    else
                        Message('Dotnet still loading....');
                end;
            }
        }
    }



    trigger OnOpenPage()
    begin

    end;

    trigger OnQueryClosePage(CloseAction: Action): Boolean
    begin
        if CloseAction = CloseAction::Cancel then begin
            gQRCode := '';
        end;
    end;


    procedure GetQR(): Text
    begin
        exit(gQRCode);
    end;


    var
        gdocNo: code[20];
        //gdocdate: Date;

        gQRCode: Text[2048];

        Ready: Boolean;


}

