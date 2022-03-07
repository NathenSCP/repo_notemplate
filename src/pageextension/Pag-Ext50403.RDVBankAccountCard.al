pageextension 50403 "RDV Bank Account Card" extends "Bank Account Card"
{
    layout
    {
        addafter(Transfer)
        {
            group("Check with Signature")
            {
                Caption = 'Check with Signature';

                //field("Bank Name"; Rec."AMC Bank Name")
                //{
                //    ApplicationArea = Basic, Suite;
                //    Importance = Additional;
                //    Caption = 'Bank Name';
                //}
                field("First Signature"; Rec."SCP First Signature")
                {
                    ApplicationArea = Basic, Suite;
                    Importance = Additional;
                }
                field("Second Signature"; Rec."SCP Second Signature")
                {
                    ApplicationArea = Basic, Suite;
                    Importance = Additional;
                }
                field("Max Amount with Signature"; Rec."SCP Max Amount with Signature")
                {
                    ApplicationArea = Basic, Suite;
                    Importance = Additional;
                }

            }
        }
    }
    //var
    //    t: record "AMC Bank Banks"

}