using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace InfoConn.Core
{
    public class EventSource : BaseEntity
    {
        public int UserId { get; set; }
        public int EventSourceType { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string AccessToken { get; set; }
        public string RefressToken { get; set; }

        public DateTime LastModified { get; set; }
    }
}
