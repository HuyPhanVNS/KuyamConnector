using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Data.Entity;
using System.Data.Entity.Validation;
using InfoConn.Core.Domain;

namespace InfoConn.Data.Respositories
{
    public class EventRepository : IEventRepository
    {
        IDbContext _context;
        private IDbSet<Event> _entities;

        private IDbSet<Event> Entities
        {
            get
            {
                if (_entities == null)
                    _entities = _context.Set<Event>();
                return _entities;
            }
        }

        public EventRepository(IDbContext context)
        {
            this._context = context;
        }
        public Event GetById(object id)
        {
            return this.Entities.Find(id);

        }

        public void Insert(Event entity)
        {
            try
            {
                if (entity == null)
                    throw new ArgumentNullException("entity");

                if (entity.StartDate == DateTime.MinValue)
                    entity.StartDate = (DateTime)System.Data.SqlTypes.SqlDateTime.MinValue;
                if (entity.EndDate == DateTime.MinValue)
                    entity.EndDate = (DateTime)System.Data.SqlTypes.SqlDateTime.MinValue;

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

        public void InsertNotSubmit(Event entity)
        {
            try
            {
                if (entity == null)
                    throw new ArgumentNullException("entity");

                if (entity.StartDate == DateTime.MinValue)
                    entity.StartDate = (DateTime)System.Data.SqlTypes.SqlDateTime.MinValue;
                if (entity.EndDate == DateTime.MinValue)
                    entity.EndDate = (DateTime)System.Data.SqlTypes.SqlDateTime.MinValue;

                this.Entities.Add(entity);
               
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

        public void Update(Event entity)
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

        public void Delete(Event entity)
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

        public void Delete(List<Event> entities)
        {
            try
            {
                foreach (Event entity in entities)
                {
                    if (entity == null)
                        throw new ArgumentNullException("entity");

                    this.Entities.Remove(entity);
                }
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

        public void DeleteNotSubmit(Event entity)
        {
            try
            {
                if (entity == null)
                    throw new ArgumentNullException("entity");


                this.Entities.Remove(entity);               
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

        public void SummitChange()
        {
            this._context.SaveChanges();
        }
                
        public IQueryable<Event> Table
        {
            get { return _context.Set<Event>(); }
        }
    }
}
