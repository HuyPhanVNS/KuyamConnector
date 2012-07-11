using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;

namespace InfoConn.Core.Domain
{
    public class Event : BaseEntity
    {
        public string EventId { get; set; }
        public int ConnectorSourceId { get; set; }
        public int? CalendarId { get; set; }
        public string Summary { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }
        public string UId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        
        public ConnectorSource ConnectorSource { get; set; }
        [XmlIgnore]
        public Calendar Calendar { get; set; }
    }
}
