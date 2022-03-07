/// <summary>
/// Page newcustomerapi (ID 50410).
/// </summary>
page 50410 newcustomerapi
{

    APIGroup = 'g1';
    APIPublisher = 'scp';
    APIVersion = 'v2.0', 'v1.0';
    Caption = 'newcustomerapi';
    DelayedInsert = true;
    EntityName = 'newcustomer';
    EntitySetName = 'newcustomers';
    PageType = API;
    SourceTable = NewCustomerInfo;

    layout
    {
        area(content)
        {
            repeater(General)
            {
                field(customerName; Rec."Customer Name")
                {

                }
                field(phoneNo; Rec."Phone No.")
                {

                }
                field(address; Rec.Address)
                {

                }
                field(email; Rec.Email)
                {

                }
                field(city; Rec.City)
                {

                }
                field(province; Rec.Province)
                {

                }
                field(postcode; Rec.PostCode)
                {

                }
            }
        }
    }

}
