reportextension 50400 MyExtension extends "Purchase Quote NA"
{
    RDLCLayout = './layout-rdlc/Rep-Ext50400.PurchaseQuoteNA.Extension.rdl';

    dataset
    {
        addfirst("Purchase Line")
        {
            dataitem(Item; Item)
            {
                DataItemLink = "No." = FIELD("No.");
                DataItemLinkReference = "Purchase Line";

                column(Picture; Picture)
                {
                }
                column(Description; Description)
                {
                }
            }
        }
    }
}