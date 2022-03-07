/// <summary>
/// Page Test MyDotNet in AL (ID 50416).
/// </summary>
page 50416 "Test MyDotNet in AL"
{
    PageType = NavigatePage;
    UsageCategory = Administration;
    ApplicationArea = all;
    layout
    {
        area(Content)
        {
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
                        CurrPage.Test.Ping('df')
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
    var
        Ready: Boolean;
}