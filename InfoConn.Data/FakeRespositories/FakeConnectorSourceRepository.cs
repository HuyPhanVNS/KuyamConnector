using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using InfoConn.Data.Respositories;
using InfoConn.Core.Domain;

namespace InfoConn.Data.FakeRespositories
{
    public class FakeConnectorSourceRepository : IConnectorSourceRepository
    {
        public ConnectorSource GetById(object id)
        {
            throw new NotImplementedException();
        }

        public void Insert(ConnectorSource entity)
        {
            throw new NotImplementedException();
        }

        public void Update(ConnectorSource entity)
        {
            throw new NotImplementedException();
        }

        public void Delete(ConnectorSource entity)
        {
            throw new NotImplementedException();
        }

        public IQueryable<ConnectorSource> Table
        {
            get
            {
                return new List<ConnectorSource>()
                {
                    new ConnectorSource
                    {
                        UserId = 2,
                        AccessToken = "ya29.AHES6ZQpBzbzCToB5CoX_-1s4AKB6P5GUkYuR-N6r5xcavc",
                        ConnectorSourceType = (int)ConnectorSourceType.Google,
                        LastModified = DateTime.Now,
                        RefressToken = "1/ERZB6NIRXkiWOu5bp6CF9aQFrpMgwcW9UASBds4QE-s",
                        Id = 1,
                        Password = "",
                        Username = ""
                    } ,
                    new ConnectorSource
                    {
                        UserId = 3,
                        AccessToken = "AAAGFQHZBFecgBAC6ZAAKfdJweAu6ZCGxUSNqUwsPjIwsLnml94c1iTOU6DDd7Sf4bKWZAZCDDZC9ZAeIEgF9AjQRznyWGx645jVmnvKWVPlrQZDZD",
                        ConnectorSourceType = (int)ConnectorSourceType.Facebook,
                        LastModified = DateTime.Now,
                        RefressToken = "",
                        Id = 1,
                        Password = "",
                        Username = ""
                    },
                    new ConnectorSource
                    {
                        UserId = 1,
                        AccessToken = "",
                        ConnectorSourceType = (int)ConnectorSourceType.iCalendar,
                        LastModified = DateTime.Now,
                        RefressToken = "",
                        Id = 1,
                        FeedUrl=@"C:\\00001.ics",
                        Password = "",
                        Username = ""
                    }
                }.AsQueryable();
            }
        }
    }
}
