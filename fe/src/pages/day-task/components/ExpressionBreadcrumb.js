import { Link } from 'react-scroll';

export function ExpressionBreadcrumb({ item }) {

   return (
      <li className="col align-end margin-1-b">
         <Link to={`expr-${item.id}`} className="color-black-3 margin-05-b btn-link" smooth={true} offset={-100}  >{item.description}</Link>
         <label className="color-grey font-75" >{item.meaning}</label>
      </li>
   )
}