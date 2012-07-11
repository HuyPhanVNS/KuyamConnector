using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Xml.Serialization;

namespace InfoConn.Core.Domain
{
    #region CACHING_CODE
    public enum CacheType
    {
        Short = 1,
        Medium = 2,
        Longer = 3
    }
    #endregion

    public class ConnectorSource : BaseEntity
    {
        public int UserId { get; set; }
        public int ConnectorSourceType { get; set; }
        public string FeedUrl { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string AccessToken { get; set; }
        public string RefressToken { get; set; }
        public DateTime LastModified { get; set; }
        public DateTime ExpiresDate { get; set; }
        public bool IsUpdateRunning { get; set; }

        [XmlIgnore]
        public ICollection<Calendar> Calendars { get; set; }

        [XmlIgnore]
        public ICollection<Event> Events { get; set; }

        #region CACHING_CODE
        // Caching Values
        public DateTime CacheLastUpdate_Short { get; set; }
        public DateTime CacheLastUpdate_Medium { get; set; }
        public DateTime CacheLastUpdate_Longer { get; set; }
        public bool DoCacheUpdate_Short { get; set; }
        public bool DoCacheUpdate_Medium { get; set; }
        public bool DoCacheUpdate_Longer { get; set; }
        #endregion
    }
}
