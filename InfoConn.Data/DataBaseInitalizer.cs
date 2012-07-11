using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace InfoConn.Data
{
    public class DataBaseInitalizer:System.Data.Entity.DropCreateDatabaseIfModelChanges<InfoConnContext>
    {
        protected override void Seed(InfoConnContext context)
        {
            
        }
    }
}
