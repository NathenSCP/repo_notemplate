/// <summary>
/// PageExtension RDV Customer Card Ext (ID 50408) extends Record Customer Card.
/// </summary>
pageextension 50408 "RDV Customer Card Ext" extends "Customer Card"
{
    actions
    {
        addafter("Co&mments")
        {
            action(ActionName)
            {
                ApplicationArea = All;
                Caption = 'Item Wish Lists';
                Promoted = true;
                Image = ViewComments;
                PromotedIsBig = true;
                PromotedCategory = Category9;
                //RunObject = Page "Item wish list";
                //RunPageLink = "Customer No." = FIELD("No.");

                trigger OnAction()
                var
                    p: Page "Item wish list";
                begin
                    p.SetCustomerNo(Rec."No.");
                    p.RunModal();
                end;
            }
        }
    }
}
