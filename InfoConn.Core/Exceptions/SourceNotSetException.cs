using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace InfoConn.Core.Exceptions
{
    public class SourceNotSetException:ConnectorException
    {
        public SourceNotSetException()
            :base("Source not set, please call init to setup source for connector!")
        {

        }
    }
}
