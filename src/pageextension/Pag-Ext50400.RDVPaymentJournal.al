pageextension 50400 "RDV Payment Journal" extends "Payment Journal"
{
    layout
    {
        //addafter("Posting Date")
        //{
        //    field("Print with Signature Approved"; "SCP Print with Sign. Approved")
        //    {
        //    }
        //}
    }
    actions
    {
        addafter(PrintCheck)
        {
            action(PrintCheckSignature)
            {
                Caption = 'Print Check with Signature';
                ApplicationArea = Basic, Suite;
                Image = ViewCheck;
                Promoted = true;
                PromotedCategory = Category11;

                trigger OnAction()
                var
                    lrepRDVCheque: Report "RDV Check (Stub/Check/Stub)";
                    lrecGenJnlLine: Record "Gen. Journal Line";
                //DocPrint: Codeunit "Document-Print";
                begin
                    lrecGenJnlLine.RESET;
                    lrecGenJnlLine.COPY(Rec);
                    lrecGenJnlLine.SETRANGE("Journal Template Name", Rec."Journal Template Name");
                    lrecGenJnlLine.SETRANGE("Journal Batch Name", Rec."Journal Batch Name");
                    //DocPrint.PrintCheck(lrecGenJnlLine);
                    lrecGenJnlLine.SETRANGE("SCP Print with Sign. Approved", TRUE);
                    lrepRDVCheque.SETTABLEVIEW(lrecGenJnlLine);
                    lrepRDVCheque.SetPrintWithSignature;
                    lrepRDVCheque.USEREQUESTPAGE(TRUE);
                    lrepRDVCheque.RUNMODAL;
                    CLEAR(lrepRDVCheque);
                    CODEUNIT.RUN(CODEUNIT::"Adjust Gen. Journal Balance", lrecGenJnlLine);
                end;
            }
        }
    }
}