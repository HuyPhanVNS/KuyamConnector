using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Entity;
using InfoConn.Core;
using InfoConn.Core.Domain;
using System.Data;
using System.Data.Common;
using System.Data.Entity.Infrastructure;

namespace InfoConn.Data
{
    public class InfoConnContext : DbContext, IDbContext
    {
        public InfoConnContext()
            :base("InfoConn")
        {
                    
        }

        public DbSet<Event> Events { get; set; }

        public DbSet<Calendar> Calendars { get; set; }

        public DbSet<ConnectorUpdateListener> ConnectorUpdateListeners { get; set; }

        public string CreateDatabaseScript()
        {
            return ((IObjectContextAdapter)this).ObjectContext.CreateDatabaseScript();
        }

        public new IDbSet<TEntity> Set<TEntity>() where TEntity : BaseEntity
        {
            return base.Set<TEntity>();
        }

       
    }
}
