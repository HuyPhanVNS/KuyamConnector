using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Newtonsoft.Json;

namespace InfoConn.Core.Domain.DTO
{
     public class FBEventList
    {
        [JsonProperty(PropertyName = "data")]
        public IList<FBEvent> Data { get; set; }
    }
}
