using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;

namespace InfoConn.Core.Domain
{
    public class Calendar : BaseEntity
    {        
        public string CalendarId { get; set; }
        public int ConnectorSourceId { get; set; }
        public string Summary { get; set; }
        public string Description { get; set; }
        public string Location { get; set; }

        [XmlIgnore]
        public ConnectorSource ConnectorSource { get; set; }
        [XmlIgnore]
        public ICollection<Event> Events { get; set; }
    }
}
