using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace InfoConn.Core.Domain
{
    public class ConnectorUpdateListener:BaseEntity
    {
        public int UserId { get; set; }
        public int ConnectorType { get; set; }
        public bool InProgress { get; set; }
    }
}
