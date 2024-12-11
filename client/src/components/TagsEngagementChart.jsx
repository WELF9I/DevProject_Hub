import React from 'react'
import { useQuery } from '@tanstack/react-query'
import HighchartsReact from 'highcharts-react-official'
import { getTagsEngagement } from '../apis/projects'
import Highcharts from 'highcharts'
import Spinner from './Spinner'
import ErrorState from './ErrorState'

/**
 @description This is pie chart component from Highcharts to desplay the top 5 tags by their engagement among the existing projects
 */
const TagsEngagementChart = () => {
  const { data: tagsEngagement, isLoading, error } = useQuery({
    queryKey: ['tagsEngagement'],
    queryFn: getTagsEngagement,
  })

  const chartBaseConfig = {
    chart: {
      backgroundColor: 'transparent',
      style: {
        fontFamily: 'inherit'
      }
    },
    title: {
      style: {
        color: 'hsl(var(--foreground))'
      }
    },
    xAxis: {
      labels: {
        style: {
          color: 'hsl(var(--foreground))'
        }
      },
      title: {
        style: {
          color: 'hsl(var(--foreground))'
        }
      }
    },
    yAxis: {
      labels: {
        style: {
          color: 'hsl(var(--foreground))'
        }
      },
      title: {
        style: {
          color: 'hsl(var(--foreground))'
        }
      },
      gridLineColor: 'rgba(128, 128, 128, 0.2)'
    },
    legend: {
      itemStyle: {
        color: 'hsl(var(--foreground))'
      }
    }
  }

  const tagsChartOptions = {
    ...chartBaseConfig,
    chart: {
      ...chartBaseConfig.chart,
      type: 'pie'
    },
    title: {
      ...chartBaseConfig.title,
      text: 'Popular Tags by Engagement'
    },
    series: [{
      name: 'Engagement',
      data: tagsEngagement?.map(tag => ({
        name: tag.name,
        y: parseInt(tag.value)
      })) || []
    }]
  }

  if (isLoading) return <Spinner />
  if (error) return <ErrorState />

  return (
    <div className="max-w-6xl mx-auto">
      <div className="space-y-6">
        <div className="w-full sm:w-11/12 mx-auto">
          <HighchartsReact 
            highcharts={Highcharts} 
            options={tagsChartOptions} 
            containerProps={{
              className: 'w-full h-128 sm:h-160'
              }} 
          />
        </div>
      </div>
    </div>
  )
}

export default TagsEngagementChart