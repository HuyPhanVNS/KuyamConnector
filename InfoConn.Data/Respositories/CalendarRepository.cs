using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Entity;
using System.Data.Entity.Validation;
using InfoConn.Core.Domain;

namespace InfoConn.Data.Respositories
{
    public class CalendarRepository : ICalendarRepository, IDisposable
    {
        IDbContext _context;
        private IDbSet<Calendar> _entities;

        private IDbSet<Calendar> Entities
        {
            get
            {
                if (_entities == null)
                    _entities = _context.Set<Calendar>();
                return _entities;
            }
        }

        public CalendarRepository(IDbContext context)
        {
            this._context = context;
        }
        public Calendar GetById(object id)
        {
            return this.Entities.Find(id);

        }

        public void Insert(Calendar entity)   
        {
            try
            {
                if (entity == null)
                    throw new ArgumentNullException("entity");

                this.Entities.Add(entity);               

                this._context.SaveChanges();
            }
            catch (DbEntityValidationException dbEx)
            {
                var msg = string.Empty;

                foreach (var validationErrors in dbEx.EntityValidationErrors)
                    foreach (var validationError in validationErrors.ValidationErrors)
                        msg += string.Format("Property: {0} Error: {1}", validationError.PropertyName, validationError.ErrorMessage) + Environment.NewLine;

                var fail = new Exception(msg, dbEx);
                //Debug.WriteLine(fail.Message, fail);
                throw fail;
            }
        }

        public void Update(Calendar entity)
        {
            try
            {
                if (entity == null)
                    throw new ArgumentNullException("entity");

                this._context.SaveChanges();
            }
            catch (DbEntityValidationException dbEx)
            {
                var msg = string.Empty;

                foreach (var validationErrors in dbEx.EntityValidationErrors)
                    foreach (var validationError in validationErrors.ValidationErrors)
                        msg += Environment.NewLine + string.Format("Property: {0} Error: {1}", validationError.PropertyName, validationError.ErrorMessage);

                var fail = new Exception(msg, dbEx);
                //Debug.WriteLine(fail.Message, fail);
                throw fail;
            }
        }

        public void Delete(Calendar entity)
        {
            try
            {
                if (entity == null)
                    throw new ArgumentNullException("entity");

                this.Entities.Remove(entity);

                this._context.SaveChanges();
            }
            catch (DbEntityValidationException dbEx)
            {
                var msg = string.Empty;

                foreach (var validationErrors in dbEx.EntityValidationErrors)
                    foreach (var validationError in validationErrors.ValidationErrors)
                        msg += Environment.NewLine + string.Format("Property: {0} Error: {1}", validationError.PropertyName, validationError.ErrorMessage);

                var fail = new Exception(msg, dbEx);
                //Debug.WriteLine(fail.Message, fail);
                throw fail;
            }
        }

        public IQueryable<Calendar> Table
        {
            get { return _context.Set<Calendar>(); }
        }

        public void DeleteNotSubmit(Calendar entity) { }
        public void InsertNotSubmit(Calendar entity) { }
        public void Delete(List<Calendar> entities) { }
        public void SummitChange() { }

        public void Dispose()
        {
           
        }

    }
}
