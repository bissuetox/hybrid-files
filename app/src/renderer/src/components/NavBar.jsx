import { NAVBTNS, PAGES } from '../utils/constants'

export default function NavBar({ currPage, setCurrPage }) {
  return (
    <div className="flex h-[75px] island justify-between items-center ">
      <div className="flex justify-start gap-2">
        {NAVBTNS.map((val, i) => {
          const selected = currPage === val.page ? 'selected' : ''
          return (
            <button
              key={i}
              className={`btn ${selected} h-10 w-[100px]`}
              onClick={() => setCurrPage(val.page)}
            >
              {val.label}
            </button>
          )
        })}
      </div>
      <div>
        <button
          className={`btn h-10 w-[100px]`}
          onClick={() => setCurrPage(PAGES.LOGIN)}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
