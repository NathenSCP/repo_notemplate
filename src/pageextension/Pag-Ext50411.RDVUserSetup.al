pageextension 50411 MyExtension extends "User Setup"
{
    actions
    {
        addlast(Reporting)
        {
            action(ActionName)
            {
                ApplicationArea = All;
                Caption = 'Setup All Users';
                Promoted = true;
                PromotedCategory = Process;
                PromotedIsBig = true;
                Image = Users;
                trigger OnAction()
                var
                    UserSetup: Codeunit RDVUserSetup;
                begin
                    UserSetup.Run();
                end;
            }
        }
    }

    var
        myInt: Integer;
}