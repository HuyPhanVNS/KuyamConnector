using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace InfoConn.Core
{
    public class ServiceResponse<T>
    {
        public bool IsSuccess { get; set; }
        public T Response { get; set; }
        public ServiceError Error { get; set; }

        public class ServiceError
        {
            public string Type { get; set; }
            public string Message { get; set; }
        }
    }
}
